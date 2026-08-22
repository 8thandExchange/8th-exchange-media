-- Recoverable, per-variant GHL delivery leases and atomic publish-time rights
-- validation prevent duplicate posts and stale-license publishing.

alter table public.portal_social_posts
  add column if not exists publishing_started_at timestamptz;

create table if not exists public.portal_social_delivery_attempts (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.portal_social_posts(id) on delete cascade,
  group_key text not null,
  content_hash text not null,
  account_ids text[] not null,
  status text not null check (status in ('reserved', 'succeeded', 'failed')),
  ghl_post_id text,
  error text,
  attempts integer not null default 1,
  lease_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (post_id, group_key)
);
alter table public.portal_social_delivery_attempts enable row level security;
create index if not exists portal_social_delivery_post_idx
  on public.portal_social_delivery_attempts(post_id, status);

create or replace function public.reserve_social_delivery(
  p_post_id uuid,
  p_group_key text,
  p_content_hash text,
  p_account_ids text[]
) returns table(action text, existing_ghl_post_id text)
language plpgsql
security definer
set search_path = public
as $$
declare
  delivery public.portal_social_delivery_attempts;
begin
  select * into delivery
  from public.portal_social_delivery_attempts
  where post_id = p_post_id and group_key = p_group_key
  for update;

  if delivery.id is null then
    insert into public.portal_social_delivery_attempts
      (post_id, group_key, content_hash, account_ids, status, lease_expires_at)
    values
      (p_post_id, p_group_key, p_content_hash, p_account_ids,
       'reserved', now() + interval '10 minutes');
    return query select 'execute'::text, null::text;
    return;
  end if;

  if delivery.status = 'succeeded' then
    return query select 'skip'::text, delivery.ghl_post_id;
    return;
  end if;

  if delivery.status = 'reserved' and delivery.lease_expires_at > now() then
    raise exception 'DELIVERY_BUSY';
  end if;

  update public.portal_social_delivery_attempts
  set status = 'reserved',
      content_hash = p_content_hash,
      account_ids = p_account_ids,
      attempts = attempts + 1,
      error = null,
      lease_expires_at = now() + interval '10 minutes',
      updated_at = now()
  where id = delivery.id;
  return query select 'execute'::text, null::text;
end;
$$;

create or replace function public.complete_social_delivery(
  p_post_id uuid,
  p_group_key text,
  p_status text,
  p_ghl_post_id text default null,
  p_error text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_status not in ('succeeded', 'failed') then
    raise exception 'INVALID_DELIVERY_STATUS';
  end if;
  update public.portal_social_delivery_attempts
  set status = p_status,
      ghl_post_id = coalesce(p_ghl_post_id, ghl_post_id),
      error = p_error,
      lease_expires_at = null,
      updated_at = now()
  where post_id = p_post_id and group_key = p_group_key;
end;
$$;

create or replace function public.creative_claim_social_publish(
  p_post_id uuid,
  p_expected_updated_at timestamptz,
  p_platforms text[],
  p_media_urls text[]
) returns public.portal_social_posts
language plpgsql
security definer
set search_path = public
as $$
declare
  post public.portal_social_posts;
  project public.creative_projects;
begin
  select * into post
  from public.portal_social_posts
  where id = p_post_id
  for update;

  if post.id is null or post.creative_project_id is null then
    raise exception 'UNKNOWN_CREATIVE_POST';
  end if;
  if post.updated_at <> p_expected_updated_at then
    raise exception 'STALE_POST';
  end if;
  if not (
    post.status in ('approved', 'failed') or
    (post.status = 'publishing'
     and post.publishing_started_at < now() - interval '15 minutes')
  ) then
    raise exception 'POST_NOT_PUBLISHABLE';
  end if;

  select * into project
  from public.creative_projects
  where id = post.creative_project_id;
  if project.id is null or project.status not in ('approved', 'released', 'completed') then
    raise exception 'PROJECT_NOT_APPROVED';
  end if;
  if post.creative_source_revision_id is null
     or post.creative_approved_hash is null
     or not exists (
       select 1
       from public.creative_artifact_revisions revision
       join public.creative_reviews review
         on review.revision_id = revision.id
        and review.project_id = project.id
        and review.decision = 'approved'
        and review.content_hash = revision.content_hash
       where revision.id = post.creative_source_revision_id
         and revision.content_hash = post.creative_approved_hash
     ) then
    raise exception 'REVISION_NOT_APPROVED';
  end if;
  if not exists (
    select 1
    from public.creative_rights_assets asset
    where asset.project_id = project.id
      and asset.asset_type = 'final_master'
      and asset.source_url = any(p_media_urls)
      and asset.status = 'cleared'
  ) then
    raise exception 'MASTER_NOT_CLEARED';
  end if;
  if exists (
    select 1
    from public.creative_rights_assets asset
    where asset.project_id = project.id
      and asset.asset_type <> 'reference'
      and (
        asset.status <> 'cleared'
        or (asset.valid_from is not null and asset.valid_from > current_date)
        or (asset.expires_at is not null and asset.expires_at < current_date)
        or (
          cardinality(asset.allowed_channels) > 0
          and not (p_platforms <@ asset.allowed_channels)
        )
      )
  ) then
    raise exception 'RIGHTS_NOT_VALID';
  end if;

  update public.portal_social_posts
  set status = 'publishing',
      publishing_started_at = now(),
      error = null,
      updated_at = now()
  where id = p_post_id
  returning * into post;
  return post;
end;
$$;

create or replace function public.creative_update_rights_asset(
  p_project_id uuid,
  p_expected_status text,
  p_lock_version integer,
  p_asset_id uuid,
  p_status text,
  p_evidence_url text default null,
  p_restrictions text default null
) returns public.creative_rights_assets
language plpgsql
security definer
set search_path = public
as $$
declare changed public.creative_projects; asset public.creative_rights_assets;
begin
  if p_expected_status in ('completed', 'archived') then raise exception 'PROJECT_NOT_EDITABLE'; end if;
  if exists (
    select 1 from public.portal_social_posts
    where creative_project_id = p_project_id and status = 'publishing'
  ) then raise exception 'PUBLISHING_IN_PROGRESS'; end if;
  update public.creative_projects
  set lock_version=lock_version+1,updated_at=now()
  where id=p_project_id and status=p_expected_status and lock_version=p_lock_version
  returning * into changed;
  if changed.id is null then raise exception 'STALE_PROJECT'; end if;
  update public.creative_rights_assets
  set status=p_status,
      evidence_url=coalesce(nullif(trim(coalesce(p_evidence_url,'')),''),evidence_url),
      restrictions=case when p_restrictions is null then restrictions else nullif(trim(p_restrictions),'') end,
      cleared_by=case when p_status='cleared' then 'staff' else null end,
      cleared_at=case when p_status='cleared' then now() else null end,
      updated_at=now()
  where id=p_asset_id and project_id=p_project_id
  returning * into asset;
  if asset.id is null then raise exception 'UNKNOWN_ASSET'; end if;
  return asset;
end;
$$;

create or replace function public.creative_delete_rights_asset(
  p_project_id uuid,
  p_expected_status text,
  p_lock_version integer,
  p_asset_id uuid
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare changed public.creative_projects;
begin
  if p_expected_status in ('completed', 'archived') then raise exception 'PROJECT_NOT_EDITABLE'; end if;
  if exists (
    select 1 from public.portal_social_posts
    where creative_project_id=p_project_id and status='publishing'
  ) then raise exception 'PUBLISHING_IN_PROGRESS'; end if;
  update public.creative_projects
  set lock_version=lock_version+1,updated_at=now()
  where id=p_project_id and status=p_expected_status and lock_version=p_lock_version
  returning * into changed;
  if changed.id is null then raise exception 'STALE_PROJECT'; end if;
  delete from public.creative_rights_assets
  where id=p_asset_id and project_id=p_project_id;
  if not found then raise exception 'UNKNOWN_ASSET'; end if;
end;
$$;

revoke all on function public.reserve_social_delivery(uuid,text,text,text[]) from public,anon,authenticated;
revoke all on function public.complete_social_delivery(uuid,text,text,text,text) from public,anon,authenticated;
revoke all on function public.creative_claim_social_publish(uuid,timestamptz,text[],text[]) from public,anon,authenticated;
revoke all on function public.creative_delete_rights_asset(uuid,text,integer,uuid) from public,anon,authenticated;
grant execute on function public.reserve_social_delivery(uuid,text,text,text[]) to service_role;
grant execute on function public.complete_social_delivery(uuid,text,text,text,text) to service_role;
grant execute on function public.creative_claim_social_publish(uuid,timestamptz,text[],text[]) to service_role;
grant execute on function public.creative_delete_rights_asset(uuid,text,integer,uuid) to service_role;
