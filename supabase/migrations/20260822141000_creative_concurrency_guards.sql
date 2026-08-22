-- Atomic artifact/rights writes and a publishing reservation state prevent
-- review races and duplicate external side effects.

alter table public.portal_social_posts
  drop constraint if exists portal_social_posts_status_check;
alter table public.portal_social_posts
  add constraint portal_social_posts_status_check
  check (status in (
    'idea', 'draft', 'pending_approval', 'approved', 'rejected',
    'publishing', 'scheduled', 'published', 'failed', 'canceled'
  ));

drop index if exists public.portal_social_posts_creative_content_unique;
create unique index portal_social_posts_creative_content_unique
  on public.portal_social_posts(creative_project_id, creative_content_key)
  where creative_project_id is not null
    and creative_content_key is not null
    and status <> 'canceled';

create or replace function public.creative_create_artifact_revision(
  p_project_id uuid,
  p_expected_status text,
  p_lock_version integer,
  p_artifact_id uuid,
  p_content jsonb,
  p_content_hash text,
  p_created_by text default 'staff'
) returns public.creative_artifact_revisions
language plpgsql
security definer
set search_path = public
as $$
declare
  changed public.creative_projects;
  existing public.creative_artifact_revisions;
  revision public.creative_artifact_revisions;
  artifact public.creative_artifacts;
begin
  if p_expected_status not in ('planning', 'in_production', 'changes_requested') then
    raise exception 'PROJECT_NOT_EDITABLE';
  end if;

  select * into artifact
  from public.creative_artifacts
  where id = p_artifact_id and project_id = p_project_id;
  if artifact.id is null then raise exception 'UNKNOWN_ARTIFACT'; end if;

  update public.creative_projects
  set lock_version = lock_version + 1, updated_at = now()
  where id = p_project_id
    and status = p_expected_status
    and lock_version = p_lock_version
  returning * into changed;
  if changed.id is null then raise exception 'STALE_PROJECT'; end if;

  select * into existing
  from public.creative_artifact_revisions
  where artifact_id = p_artifact_id and content_hash = p_content_hash;

  if existing.id is not null then
    revision := existing;
  else
    insert into public.creative_artifact_revisions
      (artifact_id, revision_number, schema_key, schema_version, content,
       content_hash, generation_method, created_by)
    values
      (p_artifact_id,
       coalesce((select max(revision_number) + 1
                 from public.creative_artifact_revisions
                 where artifact_id = p_artifact_id), 1),
       (select schema_key from public.creative_artifact_revisions
        where id = artifact.current_revision_id),
       (select schema_version from public.creative_artifact_revisions
        where id = artifact.current_revision_id),
       p_content, p_content_hash, 'manual', p_created_by)
    returning * into revision;
  end if;

  update public.creative_artifacts
  set current_revision_id = revision.id,
      selected_revision_id = revision.id,
      state = 'working',
      updated_at = now()
  where id = p_artifact_id and project_id = p_project_id;

  return revision;
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
declare
  changed public.creative_projects;
  asset public.creative_rights_assets;
begin
  if p_expected_status in ('completed', 'archived') then
    raise exception 'PROJECT_NOT_EDITABLE';
  end if;
  update public.creative_projects
  set lock_version = lock_version + 1, updated_at = now()
  where id = p_project_id
    and status = p_expected_status
    and lock_version = p_lock_version
  returning * into changed;
  if changed.id is null then raise exception 'STALE_PROJECT'; end if;

  insert into public.creative_rights_assets
    (project_id, client_id, label, asset_type, source_url, owner_name,
     rights_basis, status, allowed_channels, allowed_territories,
     modification_allowed, expires_at, evidence_url, restrictions,
     cleared_by, cleared_at)
  values
    (p_project_id, changed.client_id, p_asset->>'label', p_asset->>'assetType',
     p_asset->>'sourceUrl', p_asset->>'ownerName', p_asset->>'rightsBasis',
     p_asset->>'status',
     coalesce(array(select jsonb_array_elements_text(p_asset->'allowedChannels')), '{}'),
     coalesce(array(select jsonb_array_elements_text(p_asset->'allowedTerritories')), '{}'),
     coalesce((p_asset->>'modificationAllowed')::boolean, false),
     nullif(p_asset->>'expiresAt', '')::date,
     nullif(p_asset->>'evidenceUrl', ''),
     nullif(p_asset->>'restrictions', ''),
     case when p_asset->>'status' = 'cleared' then 'staff' else null end,
     case when p_asset->>'status' = 'cleared' then now() else null end)
  returning * into asset;
  return asset;
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
declare
  changed public.creative_projects;
  asset public.creative_rights_assets;
begin
  if p_expected_status in ('completed', 'archived') then
    raise exception 'PROJECT_NOT_EDITABLE';
  end if;
  update public.creative_projects
  set lock_version = lock_version + 1, updated_at = now()
  where id = p_project_id
    and status = p_expected_status
    and lock_version = p_lock_version
  returning * into changed;
  if changed.id is null then raise exception 'STALE_PROJECT'; end if;

  update public.creative_rights_assets
  set status = p_status,
      evidence_url = coalesce(nullif(trim(coalesce(p_evidence_url, '')), ''), evidence_url),
      restrictions = case
        when p_restrictions is null then restrictions
        else nullif(trim(p_restrictions), '')
      end,
      cleared_by = case when p_status = 'cleared' then 'staff' else null end,
      cleared_at = case when p_status = 'cleared' then now() else null end,
      updated_at = now()
  where id = p_asset_id and project_id = p_project_id
  returning * into asset;
  if asset.id is null then raise exception 'UNKNOWN_ASSET'; end if;
  return asset;
end;
$$;

create or replace function public.creative_submit_project(
  p_id uuid,
  p_expected text,
  p_lock_version integer,
  p_manifest jsonb,
  p_client_visible boolean,
  p_note text default null,
  p_actor text default 'staff'
) returns public.creative_projects
language plpgsql
security definer
set search_path = public
as $$
declare changed public.creative_projects;
begin
  if p_expected <> 'in_production' then raise exception 'INVALID_TRANSITION'; end if;
  if exists (
    select 1 from public.creative_artifacts artifact
    where artifact.project_id = p_id and artifact.required and not exists (
      select 1 from jsonb_array_elements(p_manifest) item
      join public.creative_artifact_revisions revision
        on revision.id = (item->>'revisionId')::uuid
      where (item->>'artifactId')::uuid = artifact.id
        and revision.artifact_id = artifact.id
        and revision.id = artifact.selected_revision_id
        and revision.content_hash = item->>'contentHash'
    )
  ) then raise exception 'STALE_ARTIFACTS'; end if;
  update public.creative_projects
  set status='in_review', lock_version=lock_version+1,
      review_note=nullif(trim(coalesce(p_note,'')),''),
      client_visible=p_client_visible, updated_at=now()
  where id=p_id and status='in_production' and lock_version=p_lock_version
  returning * into changed;
  if changed.id is null then raise exception 'STALE_PROJECT'; end if;
  update public.creative_artifacts set state='in_review',updated_at=now()
  where project_id=p_id and required;
  insert into public.creative_transition_events
    (project_id,from_state,to_state,actor_type,note,metadata)
  values
    (p_id,'in_production','in_review',p_actor,
     nullif(trim(coalesce(p_note,'')),''),
     jsonb_build_object('revisionManifest',p_manifest));
  return changed;
end;
$$;

create or replace function public.creative_decide_project(
  p_id uuid,
  p_expected text,
  p_lock_version integer,
  p_manifest jsonb,
  p_decision text,
  p_reviewer_type text,
  p_reviewer_id text,
  p_reviewer_label text,
  p_note text default null
) returns public.creative_projects
language plpgsql
security definer
set search_path = public
as $$
declare changed public.creative_projects;
begin
  if p_expected <> 'in_review' then raise exception 'INVALID_TRANSITION'; end if;
  if p_decision not in ('approved','changes_requested') then raise exception 'INVALID_DECISION'; end if;
  if p_decision='changes_requested'
     and nullif(trim(coalesce(p_note,'')),'') is null then
    raise exception 'CHANGE_NOTE_REQUIRED';
  end if;
  if p_reviewer_type not in ('staff','client') then raise exception 'INVALID_REVIEWER'; end if;
  if exists (
    select 1 from public.creative_artifacts artifact
    where artifact.project_id=p_id and artifact.required and not exists (
      select 1 from jsonb_array_elements(p_manifest) item
      join public.creative_artifact_revisions revision
        on revision.id=(item->>'revisionId')::uuid
      where (item->>'artifactId')::uuid=artifact.id
        and revision.artifact_id=artifact.id
        and revision.id=artifact.selected_revision_id
        and revision.content_hash=item->>'contentHash'
    )
  ) then raise exception 'STALE_ARTIFACTS'; end if;
  update public.creative_projects
  set status=p_decision, lock_version=lock_version+1,
      review_note=nullif(trim(coalesce(p_note,'')),''),
      client_visible=case when p_decision='approved' then client_visible else false end,
      approved_by=case when p_decision='approved' then p_reviewer_label else null end,
      approved_at=case when p_decision='approved' then now() else null end,
      updated_at=now()
  where id=p_id and status='in_review' and lock_version=p_lock_version
  returning * into changed;
  if changed.id is null then raise exception 'STALE_PROJECT'; end if;
  insert into public.creative_reviews
    (project_id,revision_id,gate_key,decision,reviewer_type,reviewer_id,
     reviewer_label,note,content_hash)
  select p_id,(item->>'revisionId')::uuid,'production-package',p_decision,
    p_reviewer_type,p_reviewer_id,p_reviewer_label,
    nullif(trim(coalesce(p_note,'')),''),item->>'contentHash'
  from jsonb_array_elements(p_manifest) item;
  update public.creative_artifacts set state=p_decision,updated_at=now()
  where project_id=p_id and required;
  insert into public.creative_transition_events
    (project_id,from_state,to_state,actor_type,actor_id,note,metadata)
  values
    (p_id,'in_review',p_decision,p_reviewer_type,p_reviewer_id,
     nullif(trim(coalesce(p_note,'')),''),
     jsonb_build_object('revisionManifest',p_manifest));
  return changed;
end;
$$;

create or replace function public.creative_transition_project(
  p_id uuid,
  p_expected text,
  p_next text,
  p_lock_version integer,
  p_note text default null,
  p_actor text default 'staff'
) returns public.creative_projects
language plpgsql
security definer
set search_path = public
as $$
declare changed public.creative_projects;
begin
  if not (
    (p_expected='planning' and p_next='in_production') or
    (p_expected='changes_requested' and p_next='in_production') or
    (p_expected='approved' and p_next='released') or
    (p_expected='released' and p_next='completed') or
    (p_expected<>'archived' and p_next='archived')
  ) then raise exception 'INVALID_TRANSITION'; end if;
  update public.creative_projects
  set status=p_next,lock_version=lock_version+1,
      review_note=nullif(trim(coalesce(p_note,'')),''),
      client_visible=case
        when p_next in ('in_production','changes_requested','archived') then false
        else client_visible
      end,updated_at=now()
  where id=p_id and status=p_expected and lock_version=p_lock_version
  returning * into changed;
  if changed.id is null then raise exception 'STALE_PROJECT'; end if;
  if p_next='in_production' then
    update public.creative_artifacts set state='working',updated_at=now()
    where project_id=p_id and required;
  end if;
  insert into public.creative_transition_events
    (project_id,from_state,to_state,actor_type,note)
  values
    (p_id,p_expected,p_next,p_actor,nullif(trim(coalesce(p_note,'')),''));
  return changed;
end;
$$;

revoke all on function public.creative_create_artifact_revision(uuid,text,integer,uuid,jsonb,text,text) from public,anon,authenticated;
revoke all on function public.creative_add_rights_asset(uuid,text,integer,jsonb) from public,anon,authenticated;
revoke all on function public.creative_update_rights_asset(uuid,text,integer,uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.creative_create_artifact_revision(uuid,text,integer,uuid,jsonb,text,text) to service_role;
grant execute on function public.creative_add_rights_asset(uuid,text,integer,jsonb) to service_role;
grant execute on function public.creative_update_rights_asset(uuid,text,integer,uuid,text,text,text) to service_role;
