-- Creative Production OS v2: immutable artifacts, scripts, shot planning,
-- storyboards, SEO briefs, rights, QA, client review and repurposing lineage.

create table if not exists public.creative_projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.portal_clients(id) on delete cascade,
  growth_campaign_id uuid references public.growth_campaigns(id) on delete set null,
  name text not null,
  production_type text not null default 'short_video'
    check (production_type in ('short_video', 'long_video', 'photo_campaign', 'article', 'mixed')),
  status text not null default 'planning'
    check (status in (
      'planning', 'in_production', 'in_review', 'changes_requested',
      'approved', 'released', 'completed', 'archived'
    )),
  objective text not null,
  audience text not null,
  offer text not null,
  primary_cta text not null,
  destination_url text not null,
  channels text[] not null default '{}',
  target_duration_seconds integer not null default 30
    check (target_duration_seconds between 10 and 3600),
  brand_snapshot jsonb not null,
  source_manifest jsonb not null default '{}'::jsonb,
  client_visible boolean not null default false,
  owner_label text not null default '8E Studio',
  due_at timestamptz,
  lock_version integer not null default 1,
  review_note text,
  approved_by text,
  approved_at timestamptz,
  created_by text not null default 'staff',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists creative_projects_campaign_unique
  on public.creative_projects(growth_campaign_id)
  where growth_campaign_id is not null;

create table if not exists public.creative_artifacts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.creative_projects(id) on delete cascade,
  artifact_type text not null
    check (artifact_type in (
      'production_brief', 'hook_set', 'script', 'shot_list', 'storyboard',
      'seo_brief', 'caption_set', 'thumbnail_brief', 'repurposed_content'
    )),
  title text not null,
  state text not null default 'working'
    check (state in ('working', 'in_review', 'approved', 'changes_requested', 'superseded', 'archived')),
  current_revision_id uuid,
  selected_revision_id uuid,
  required boolean not null default true,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, artifact_type)
);

create table if not exists public.creative_generation_runs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.creative_projects(id) on delete cascade,
  recipe_key text not null,
  recipe_version text not null,
  mode text not null check (mode in ('rules', 'rules+ai', 'manual', 'import')),
  input_manifest jsonb not null,
  input_hash text not null,
  provider text,
  model text,
  prompt_version text,
  status text not null default 'completed'
    check (status in ('running', 'completed', 'failed')),
  usage jsonb not null default '{}'::jsonb,
  error text,
  created_by text not null default 'staff',
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.creative_artifact_revisions (
  id uuid primary key default gen_random_uuid(),
  artifact_id uuid not null references public.creative_artifacts(id) on delete cascade,
  revision_number integer not null check (revision_number > 0),
  schema_key text not null,
  schema_version integer not null default 1,
  content jsonb not null,
  content_hash text not null,
  generation_method text not null
    check (generation_method in ('rules', 'ai_refinement', 'manual', 'import')),
  generation_run_id uuid references public.creative_generation_runs(id) on delete set null,
  created_by text not null default 'staff',
  created_at timestamptz not null default now(),
  unique (artifact_id, revision_number),
  unique (artifact_id, content_hash)
);

alter table public.creative_artifacts
  drop constraint if exists creative_artifacts_current_revision_fkey,
  add constraint creative_artifacts_current_revision_fkey
    foreign key (current_revision_id) references public.creative_artifact_revisions(id) on delete set null,
  drop constraint if exists creative_artifacts_selected_revision_fkey,
  add constraint creative_artifacts_selected_revision_fkey
    foreign key (selected_revision_id) references public.creative_artifact_revisions(id) on delete set null;

create table if not exists public.creative_reviews (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.creative_projects(id) on delete cascade,
  revision_id uuid not null references public.creative_artifact_revisions(id) on delete cascade,
  gate_key text not null,
  decision text not null check (decision in ('approved', 'changes_requested', 'rejected', 'waived')),
  reviewer_type text not null check (reviewer_type in ('staff', 'client')),
  reviewer_id text,
  reviewer_label text not null,
  note text,
  content_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.creative_transition_events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.creative_projects(id) on delete cascade,
  artifact_id uuid references public.creative_artifacts(id) on delete set null,
  from_state text,
  to_state text not null,
  actor_type text not null default 'staff',
  actor_id text,
  note text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.creative_rights_assets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.creative_projects(id) on delete cascade,
  client_id uuid references public.portal_clients(id) on delete cascade,
  label text not null,
  asset_type text not null
    check (asset_type in (
      'b_roll', 'logo', 'product', 'location', 'talent_release',
      'music', 'sfx', 'graphic', 'reference', 'final_master'
    )),
  source_url text not null,
  owner_name text not null,
  rights_basis text not null
    check (rights_basis in ('client_owned', 'stock', 'work_for_hire', 'editorial', 'licensed', 'unknown')),
  status text not null default 'pending'
    check (status in ('pending', 'cleared', 'restricted', 'expired', 'revoked')),
  allowed_channels text[] not null default '{}',
  allowed_territories text[] not null default '{}',
  modification_allowed boolean not null default false,
  valid_from date,
  expires_at date,
  evidence_url text,
  restrictions text,
  cleared_by text,
  cleared_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.creative_revision_rights (
  revision_id uuid not null references public.creative_artifact_revisions(id) on delete cascade,
  rights_asset_id uuid not null references public.creative_rights_assets(id) on delete cascade,
  usage_description text not null,
  required boolean not null default true,
  primary key (revision_id, rights_asset_id)
);

create table if not exists public.creative_qa_runs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.creative_projects(id) on delete cascade,
  ruleset_version text not null,
  status text not null check (status in ('passed', 'failed')),
  created_at timestamptz not null default now(),
  completed_at timestamptz not null default now()
);

create table if not exists public.creative_qa_results (
  id uuid primary key default gen_random_uuid(),
  qa_run_id uuid not null references public.creative_qa_runs(id) on delete cascade,
  rule_key text not null,
  severity text not null check (severity in ('blocking', 'warning', 'advisory')),
  status text not null check (status in ('passed', 'failed', 'waived')),
  message text not null,
  evidence jsonb not null default '{}'::jsonb,
  waived_by text,
  waiver_reason text,
  created_at timestamptz not null default now(),
  unique (qa_run_id, rule_key)
);

create table if not exists public.creative_derivations (
  parent_revision_id uuid not null references public.creative_artifact_revisions(id) on delete cascade,
  child_revision_id uuid not null references public.creative_artifact_revisions(id) on delete cascade,
  recipe_key text not null,
  transformation_manifest jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  primary key (parent_revision_id, child_revision_id)
);

alter table public.portal_social_posts
  add column if not exists creative_project_id uuid
    references public.creative_projects(id) on delete set null,
  add column if not exists creative_source_revision_id uuid
    references public.creative_artifact_revisions(id) on delete set null,
  add column if not exists creative_approved_hash text,
  add column if not exists creative_content_key text;

create unique index if not exists portal_social_posts_creative_content_unique
  on public.portal_social_posts(creative_project_id, creative_content_key)
  where creative_project_id is not null and creative_content_key is not null;

create index if not exists creative_projects_client_created_idx
  on public.creative_projects(client_id, created_at desc);
create index if not exists creative_projects_campaign_idx
  on public.creative_projects(growth_campaign_id);
create index if not exists creative_artifacts_project_idx
  on public.creative_artifacts(project_id, sort_order);
create index if not exists creative_revisions_generation_run_idx
  on public.creative_artifact_revisions(generation_run_id);
create index if not exists creative_reviews_project_idx
  on public.creative_reviews(project_id, created_at desc);
create index if not exists creative_reviews_revision_idx
  on public.creative_reviews(revision_id);
create index if not exists creative_transition_project_idx
  on public.creative_transition_events(project_id, created_at desc);
create index if not exists creative_transition_artifact_idx
  on public.creative_transition_events(artifact_id);
create index if not exists creative_rights_project_idx
  on public.creative_rights_assets(project_id, created_at desc);
create index if not exists creative_rights_client_idx
  on public.creative_rights_assets(client_id);
create index if not exists creative_revision_rights_asset_idx
  on public.creative_revision_rights(rights_asset_id);
create index if not exists creative_qa_runs_project_idx
  on public.creative_qa_runs(project_id, created_at desc);
create index if not exists creative_qa_results_run_idx
  on public.creative_qa_results(qa_run_id);
create index if not exists creative_derivations_child_idx
  on public.creative_derivations(child_revision_id);
create index if not exists portal_social_posts_creative_revision_idx
  on public.portal_social_posts(creative_source_revision_id);

alter table public.creative_projects enable row level security;
alter table public.creative_artifacts enable row level security;
alter table public.creative_generation_runs enable row level security;
alter table public.creative_artifact_revisions enable row level security;
alter table public.creative_reviews enable row level security;
alter table public.creative_transition_events enable row level security;
alter table public.creative_rights_assets enable row level security;
alter table public.creative_revision_rights enable row level security;
alter table public.creative_qa_runs enable row level security;
alter table public.creative_qa_results enable row level security;
alter table public.creative_derivations enable row level security;

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
      updated_at = now()
  where id = p_id
    and status = p_expected
    and lock_version = p_lock_version
  returning * into changed;

  if changed.id is null then
    raise exception 'STALE_PROJECT';
  end if;

  insert into public.creative_transition_events
    (project_id, from_state, to_state, actor_type, note)
  values
    (p_id, p_expected, p_next, p_actor, nullif(trim(coalesce(p_note, '')), ''));

  return changed;
end;
$$;

revoke all on function public.creative_transition_project(uuid, text, text, integer, text, text)
  from public, anon, authenticated;
grant execute on function public.creative_transition_project(uuid, text, text, integer, text, text)
  to service_role;

comment on table public.creative_projects is
  'Creative Production OS projects linked to evidence-backed Growth OS campaigns.';
comment on table public.creative_artifact_revisions is
  'Immutable, hash-addressed revisions for scripts, shots, storyboards, SEO and derivatives.';
comment on table public.creative_rights_assets is
  'Rights scope and clearance evidence for every external production asset.';
