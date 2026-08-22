-- Rights mutations lock project delivery rows before the project row, matching
-- the publish claim's lock order. They recheck publishing after acquiring locks.

create or replace function public.creative_add_rights_asset(
  p_project_id uuid,
  p_expected_status text,
  p_lock_version integer,
  p_asset jsonb
) returns public.creative_rights_assets
language plpgsql security definer set search_path=public
as $$
declare project public.creative_projects; asset public.creative_rights_assets;
begin
  perform id from public.portal_social_posts
  where creative_project_id=p_project_id order by id for update;
  select * into project from public.creative_projects
  where id=p_project_id for update;
  if project.id is null or project.status<>p_expected_status
     or project.lock_version<>p_lock_version then raise exception 'STALE_PROJECT'; end if;
  if project.status in('completed','archived') then raise exception 'PROJECT_NOT_EDITABLE'; end if;
  if exists(select 1 from public.portal_social_posts
            where creative_project_id=p_project_id and status='publishing')
  then raise exception 'PUBLISHING_IN_PROGRESS'; end if;
  update public.creative_projects
  set lock_version=lock_version+1,updated_at=now() where id=p_project_id;
  insert into public.creative_rights_assets
    (project_id,client_id,label,asset_type,source_url,owner_name,rights_basis,
     status,allowed_channels,allowed_territories,modification_allowed,
     expires_at,evidence_url,restrictions,cleared_by,cleared_at)
  values
    (p_project_id,project.client_id,p_asset->>'label',p_asset->>'assetType',
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

create or replace function public.creative_update_rights_asset(
  p_project_id uuid,
  p_expected_status text,
  p_lock_version integer,
  p_asset_id uuid,
  p_status text,
  p_evidence_url text default null,
  p_restrictions text default null
) returns public.creative_rights_assets
language plpgsql security definer set search_path=public
as $$
declare project public.creative_projects; asset public.creative_rights_assets;
begin
  perform id from public.portal_social_posts
  where creative_project_id=p_project_id order by id for update;
  select * into project from public.creative_projects
  where id=p_project_id for update;
  if project.id is null or project.status<>p_expected_status
     or project.lock_version<>p_lock_version then raise exception 'STALE_PROJECT'; end if;
  if project.status in('completed','archived') then raise exception 'PROJECT_NOT_EDITABLE'; end if;
  if exists(select 1 from public.portal_social_posts
            where creative_project_id=p_project_id and status='publishing')
  then raise exception 'PUBLISHING_IN_PROGRESS'; end if;
  update public.creative_projects
  set lock_version=lock_version+1,updated_at=now() where id=p_project_id;
  update public.creative_rights_assets
  set status=p_status,
      evidence_url=coalesce(nullif(trim(coalesce(p_evidence_url,'')),''),evidence_url),
      restrictions=case when p_restrictions is null then restrictions
                        else nullif(trim(p_restrictions),'') end,
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
language plpgsql security definer set search_path=public
as $$
declare project public.creative_projects;
begin
  perform id from public.portal_social_posts
  where creative_project_id=p_project_id order by id for update;
  select * into project from public.creative_projects
  where id=p_project_id for update;
  if project.id is null or project.status<>p_expected_status
     or project.lock_version<>p_lock_version then raise exception 'STALE_PROJECT'; end if;
  if project.status in('completed','archived') then raise exception 'PROJECT_NOT_EDITABLE'; end if;
  if exists(select 1 from public.portal_social_posts
            where creative_project_id=p_project_id and status='publishing')
  then raise exception 'PUBLISHING_IN_PROGRESS'; end if;
  update public.creative_projects
  set lock_version=lock_version+1,updated_at=now() where id=p_project_id;
  delete from public.creative_rights_assets
  where id=p_asset_id and project_id=p_project_id;
  if not found then raise exception 'UNKNOWN_ASSET'; end if;
end;
$$;
