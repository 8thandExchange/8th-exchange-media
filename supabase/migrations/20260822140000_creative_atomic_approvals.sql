-- Atomic revision-manifest submission and approval. A project decision applies
-- only when every required artifact still points at the expected hash.

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
declare
  changed public.creative_projects;
begin
  if exists (
    select 1
    from public.creative_artifacts artifact
    where artifact.project_id = p_id
      and artifact.required
      and not exists (
        select 1
        from jsonb_array_elements(p_manifest) item
        join public.creative_artifact_revisions revision
          on revision.id = (item->>'revisionId')::uuid
        where (item->>'artifactId')::uuid = artifact.id
          and revision.artifact_id = artifact.id
          and revision.id = artifact.selected_revision_id
          and revision.content_hash = item->>'contentHash'
      )
  ) then
    raise exception 'STALE_ARTIFACTS';
  end if;

  update public.creative_projects
  set status = 'in_review',
      lock_version = lock_version + 1,
      review_note = nullif(trim(coalesce(p_note, '')), ''),
      client_visible = p_client_visible,
      updated_at = now()
  where id = p_id
    and status = p_expected
    and lock_version = p_lock_version
  returning * into changed;

  if changed.id is null then raise exception 'STALE_PROJECT'; end if;

  update public.creative_artifacts
  set state = 'in_review', updated_at = now()
  where project_id = p_id and required;

  insert into public.creative_transition_events
    (project_id, from_state, to_state, actor_type, note, metadata)
  values
    (p_id, p_expected, 'in_review', p_actor,
     nullif(trim(coalesce(p_note, '')), ''),
     jsonb_build_object('revisionManifest', p_manifest));

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
declare
  changed public.creative_projects;
begin
  if p_decision not in ('approved', 'changes_requested') then
    raise exception 'INVALID_DECISION';
  end if;
  if p_decision = 'changes_requested'
     and nullif(trim(coalesce(p_note, '')), '') is null then
    raise exception 'CHANGE_NOTE_REQUIRED';
  end if;
  if p_reviewer_type not in ('staff', 'client') then
    raise exception 'INVALID_REVIEWER';
  end if;

  if exists (
    select 1
    from public.creative_artifacts artifact
    where artifact.project_id = p_id
      and artifact.required
      and not exists (
        select 1
        from jsonb_array_elements(p_manifest) item
        join public.creative_artifact_revisions revision
          on revision.id = (item->>'revisionId')::uuid
        where (item->>'artifactId')::uuid = artifact.id
          and revision.artifact_id = artifact.id
          and revision.id = artifact.selected_revision_id
          and revision.content_hash = item->>'contentHash'
      )
  ) then
    raise exception 'STALE_ARTIFACTS';
  end if;

  update public.creative_projects
  set status = p_decision,
      lock_version = lock_version + 1,
      review_note = nullif(trim(coalesce(p_note, '')), ''),
      client_visible = case when p_decision = 'approved' then client_visible else false end,
      approved_by = case when p_decision = 'approved' then p_reviewer_label else null end,
      approved_at = case when p_decision = 'approved' then now() else null end,
      updated_at = now()
  where id = p_id
    and status = p_expected
    and lock_version = p_lock_version
  returning * into changed;

  if changed.id is null then raise exception 'STALE_PROJECT'; end if;

  insert into public.creative_reviews
    (project_id, revision_id, gate_key, decision, reviewer_type,
     reviewer_id, reviewer_label, note, content_hash)
  select
    p_id,
    (item->>'revisionId')::uuid,
    'production-package',
    p_decision,
    p_reviewer_type,
    p_reviewer_id,
    p_reviewer_label,
    nullif(trim(coalesce(p_note, '')), ''),
    item->>'contentHash'
  from jsonb_array_elements(p_manifest) item;

  update public.creative_artifacts
  set state = p_decision, updated_at = now()
  where project_id = p_id and required;

  insert into public.creative_transition_events
    (project_id, from_state, to_state, actor_type, actor_id, note, metadata)
  values
    (p_id, p_expected, p_decision, p_reviewer_type, p_reviewer_id,
     nullif(trim(coalesce(p_note, '')), ''),
     jsonb_build_object('revisionManifest', p_manifest));

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
declare
  changed public.creative_projects;
begin
  update public.creative_projects
  set status = p_next,
      lock_version = lock_version + 1,
      review_note = nullif(trim(coalesce(p_note, '')), ''),
      client_visible = case
        when p_next in ('in_production', 'changes_requested', 'archived') then false
        else client_visible
      end,
      updated_at = now()
  where id = p_id
    and status = p_expected
    and lock_version = p_lock_version
  returning * into changed;

  if changed.id is null then raise exception 'STALE_PROJECT'; end if;

  if p_next = 'in_production' then
    update public.creative_artifacts
    set state = 'working', updated_at = now()
    where project_id = p_id and required;
  elsif p_next = 'changes_requested' then
    update public.creative_artifacts
    set state = 'changes_requested', updated_at = now()
    where project_id = p_id and required;
  end if;

  insert into public.creative_transition_events
    (project_id, from_state, to_state, actor_type, note)
  values
    (p_id, p_expected, p_next, p_actor,
     nullif(trim(coalesce(p_note, '')), ''));

  return changed;
end;
$$;

revoke all on function public.creative_submit_project(uuid, text, integer, jsonb, boolean, text, text)
  from public, anon, authenticated;
revoke all on function public.creative_decide_project(uuid, text, integer, jsonb, text, text, text, text, text)
  from public, anon, authenticated;
grant execute on function public.creative_submit_project(uuid, text, integer, jsonb, boolean, text, text)
  to service_role;
grant execute on function public.creative_decide_project(uuid, text, integer, jsonb, text, text, text, text, text)
  to service_role;
