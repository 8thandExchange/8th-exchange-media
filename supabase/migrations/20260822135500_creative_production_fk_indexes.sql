-- Cover circular/current revision and generation-run foreign keys reported by
-- the Supabase advisor. The partial campaign-unique index already covers its FK.
drop index if exists public.creative_projects_campaign_idx;

create index if not exists creative_artifacts_current_revision_idx
  on public.creative_artifacts(current_revision_id);
create index if not exists creative_artifacts_selected_revision_idx
  on public.creative_artifacts(selected_revision_id);
create index if not exists creative_generation_runs_project_idx
  on public.creative_generation_runs(project_id);
