-- Fencing tokens prevent expired workers from overwriting newer deliveries.
-- Stale ambiguous attempts are reconciled against GHL before any retry.

alter table public.portal_social_delivery_attempts
  add column if not exists lease_token uuid;

drop function if exists public.reserve_social_delivery(uuid,text,text,text[]);
create or replace function public.reserve_social_delivery(
  p_post_id uuid,
  p_group_key text,
  p_content_hash text,
  p_account_ids text[]
) returns table(
  action text,
  existing_ghl_post_id text,
  delivery_lease_token uuid,
  reserved_since timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  delivery public.portal_social_delivery_attempts;
  token uuid;
begin
  select * into delivery
  from public.portal_social_delivery_attempts
  where post_id=p_post_id and group_key=p_group_key
  for update;

  if delivery.id is null then
    token := gen_random_uuid();
    insert into public.portal_social_delivery_attempts
      (post_id,group_key,content_hash,account_ids,status,lease_expires_at,lease_token)
    values
      (p_post_id,p_group_key,p_content_hash,p_account_ids,'reserved',
       now()+interval '10 minutes',token);
    return query select 'execute'::text,null::text,token,now();
    return;
  end if;
  if delivery.status='succeeded' then
    return query select 'skip'::text,delivery.ghl_post_id,null::uuid,delivery.updated_at;
    return;
  end if;
  if delivery.status='reserved' and delivery.lease_expires_at>now() then
    raise exception 'DELIVERY_BUSY';
  end if;
  if delivery.status='reserved' then
    return query select 'reconcile'::text,delivery.ghl_post_id,
      delivery.lease_token,delivery.updated_at;
    return;
  end if;

  token := gen_random_uuid();
  update public.portal_social_delivery_attempts
  set status='reserved',content_hash=p_content_hash,account_ids=p_account_ids,
      attempts=attempts+1,error=null,lease_expires_at=now()+interval '10 minutes',
      lease_token=token,updated_at=now()
  where id=delivery.id;
  return query select 'execute'::text,null::text,token,now();
end;
$$;

create or replace function public.complete_social_delivery(
  p_post_id uuid,
  p_group_key text,
  p_lease_token uuid,
  p_status text,
  p_ghl_post_id text default null,
  p_error text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_status not in('succeeded','failed') then
    raise exception 'INVALID_DELIVERY_STATUS';
  end if;
  update public.portal_social_delivery_attempts
  set status=p_status,ghl_post_id=coalesce(p_ghl_post_id,ghl_post_id),
      error=p_error,lease_expires_at=null,lease_token=null,updated_at=now()
  where post_id=p_post_id and group_key=p_group_key
    and lease_token=p_lease_token;
  if not found then raise exception 'STALE_DELIVERY'; end if;
end;
$$;

create or replace function public.creative_add_rights_asset(
  p_project_id uuid,
  p_expected_status text,
  p_lock_version integer,
  p_asset jsonb
) returns public.creative_rights_assets
language plpgsql
security definer
set search_path = public
as $$
declare changed public.creative_projects; asset public.creative_rights_assets;
begin
  if p_expected_status in('completed','archived') then raise exception 'PROJECT_NOT_EDITABLE'; end if;
  if exists(
    select 1 from public.portal_social_posts
    where creative_project_id=p_project_id and status='publishing'
  ) then raise exception 'PUBLISHING_IN_PROGRESS'; end if;
  update public.creative_projects
  set lock_version=lock_version+1,updated_at=now()
  where id=p_project_id and status=p_expected_status and lock_version=p_lock_version
  returning * into changed;
  if changed.id is null then raise exception 'STALE_PROJECT'; end if;
  insert into public.creative_rights_assets
    (project_id,client_id,label,asset_type,source_url,owner_name,rights_basis,
     status,allowed_channels,allowed_territories,modification_allowed,
     expires_at,evidence_url,restrictions,cleared_by,cleared_at)
  values
    (p_project_id,changed.client_id,p_asset->>'label',p_asset->>'assetType',
     p_asset->>'sourceUrl',p_asset->>'ownerName',p_asset->>'rightsBasis',
     p_asset->>'status',
     coalesce(array(select jsonb_array_elements_text(p_asset->'allowedChannels')),'{}'),
     coalesce(array(select jsonb_array_elements_text(p_asset->'allowedTerritories')),'{}'),
     coalesce((p_asset->>'modificationAllowed')::boolean,false),
     nullif(p_asset->>'expiresAt','')::date,nullif(p_asset->>'evidenceUrl',''),
     nullif(p_asset->>'restrictions',''),
     case when p_asset->>'status'='cleared' then 'staff' else null end,
     case when p_asset->>'status'='cleared' then now() else null end)
  returning * into asset;
  return asset;
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
declare post public.portal_social_posts; project public.creative_projects;
begin
  select * into post from public.portal_social_posts where id=p_post_id for update;
  if post.id is null or post.creative_project_id is null then raise exception 'UNKNOWN_CREATIVE_POST'; end if;
  if post.updated_at<>p_expected_updated_at then raise exception 'STALE_POST'; end if;
  if not(post.status in('approved','failed') or(post.status='publishing' and post.publishing_started_at<now()-interval '15 minutes')) then raise exception 'POST_NOT_PUBLISHABLE'; end if;
  select * into project from public.creative_projects
  where id=post.creative_project_id for update;
  if project.id is null or project.status not in('approved','released','completed') then raise exception 'PROJECT_NOT_APPROVED'; end if;
  if post.creative_source_revision_id is null or post.creative_approved_hash is null or not exists(
    select 1 from public.creative_artifact_revisions revision
    join public.creative_reviews review on review.revision_id=revision.id
      and review.project_id=project.id and review.decision='approved'
      and review.content_hash=revision.content_hash
    where revision.id=post.creative_source_revision_id
      and revision.content_hash=post.creative_approved_hash
  ) then raise exception 'REVISION_NOT_APPROVED'; end if;
  if not exists(
    select 1 from public.creative_rights_assets asset
    where asset.project_id=project.id and asset.asset_type='final_master'
      and asset.source_url=any(p_media_urls) and asset.status='cleared'
  ) then raise exception 'MASTER_NOT_CLEARED'; end if;
  if exists(
    select 1 from public.creative_rights_assets asset
    where asset.project_id=project.id and asset.asset_type<>'reference' and(
      asset.status<>'cleared'
      or(asset.valid_from is not null and asset.valid_from>current_date)
      or(asset.expires_at is not null and asset.expires_at<current_date)
      or(cardinality(asset.allowed_channels)>0 and not(p_platforms<@asset.allowed_channels))
    )
  ) then raise exception 'RIGHTS_NOT_VALID'; end if;
  update public.portal_social_posts
  set status='publishing',publishing_started_at=now(),error=null,updated_at=now()
  where id=p_post_id returning * into post;
  return post;
end;
$$;

drop function if exists public.complete_social_delivery(uuid,text,text,text,text);
revoke all on function public.reserve_social_delivery(uuid,text,text,text[])
  from public,anon,authenticated;
revoke all on function public.complete_social_delivery(uuid,text,uuid,text,text,text)
  from public,anon,authenticated;
grant execute on function public.reserve_social_delivery(uuid,text,text,text[])
  to service_role;
grant execute on function public.complete_social_delivery(uuid,text,uuid,text,text,text)
  to service_role;
