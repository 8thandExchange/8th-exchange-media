-- 8E Growth OS v1: evidence-backed audits, campaigns, creative and measurement.
-- Stripe remains the billing system of record and GHL remains the publisher.

create extension if not exists pgcrypto;

create table if not exists public.growth_audits (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.portal_clients(id) on delete cascade,
  website_url text not null,
  status text not null default 'running'
    check (status in ('running', 'completed', 'partial', 'failed')),
  ruleset_version text not null default '2026-08-v1',
  max_pages smallint not null default 12 check (max_pages between 1 and 25),
  pages_scanned smallint not null default 0,
  summary jsonb not null default '{}'::jsonb,
  error text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  created_by text not null default 'staff'
);

create table if not exists public.growth_audit_pages (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid not null references public.growth_audits(id) on delete cascade,
  url text not null,
  path text not null,
  http_status integer,
  content_type text,
  title text,
  meta_description text,
  canonical_url text,
  h1s text[] not null default '{}',
  word_count integer not null default 0,
  facts jsonb not null default '{}'::jsonb,
  text_excerpt text,
  content_hash text,
  error text,
  fetched_at timestamptz not null default now(),
  unique (audit_id, url)
);

create table if not exists public.growth_opportunities (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.portal_clients(id) on delete cascade,
  audit_id uuid not null references public.growth_audits(id) on delete cascade,
  audit_page_id uuid references public.growth_audit_pages(id) on delete set null,
  fingerprint text not null,
  rule_key text not null,
  category text not null,
  title text not null,
  description text not null,
  recommended_action text not null,
  evidence jsonb not null default '{}'::jsonb,
  impact smallint not null check (impact between 1 and 5),
  confidence smallint not null check (confidence between 1 and 5),
  effort smallint not null check (effort between 1 and 5),
  priority_score numeric(5,1) generated always as
    ((impact * confidence * (6 - effort))::numeric * 0.8) stored,
  status text not null default 'open'
    check (status in ('open', 'selected', 'dismissed', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (audit_id, fingerprint)
);

create table if not exists public.growth_campaigns (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.portal_clients(id) on delete cascade,
  opportunity_id uuid references public.growth_opportunities(id) on delete set null,
  name text not null,
  status text not null default 'draft'
    check (status in ('draft', 'in_review', 'changes_requested', 'approved', 'active', 'completed', 'archived')),
  objective text not null,
  audience text not null,
  offer text not null,
  primary_cta text not null,
  destination_url text not null,
  channels text[] not null default '{facebook,instagram,linkedin}',
  social_account_ids text[] not null default '{}',
  brief jsonb not null default '{}'::jsonb,
  brief_version smallint not null default 1,
  generator text not null default 'rules'
    check (generator in ('rules', 'rules+ai', 'manual')),
  generation_meta jsonb not null default '{}'::jsonb,
  client_visible boolean not null default false,
  review_note text,
  approved_by text,
  approved_at timestamptz,
  created_by text not null default 'staff',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.growth_assets (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.growth_campaigns(id) on delete cascade,
  template_key text not null check (template_key in ('statement', 'insight', 'offer')),
  format text not null check (format in ('square', 'portrait', 'story')),
  content jsonb not null,
  brand_snapshot jsonb not null,
  alt_text text not null,
  status text not null default 'draft'
    check (status in ('draft', 'approved', 'archived')),
  public_token uuid not null default gen_random_uuid() unique,
  version smallint not null default 1,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  unique (campaign_id, template_key, format, version)
);

create table if not exists public.growth_metrics (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.growth_campaigns(id) on delete cascade,
  key text not null,
  label text not null,
  unit text not null check (unit in ('count', 'currency', 'percent', 'ratio', 'duration')),
  currency text,
  direction text not null default 'increase' check (direction in ('increase', 'decrease')),
  baseline_value numeric not null,
  target_value numeric not null,
  baseline_start date,
  baseline_end date,
  created_at timestamptz not null default now(),
  unique (campaign_id, key)
);

create table if not exists public.growth_measurements (
  id uuid primary key default gen_random_uuid(),
  metric_id uuid not null references public.growth_metrics(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  value numeric not null,
  source text not null default 'manual'
    check (source in ('manual', 'ghl', 'ga4', 'stripe', 'other')),
  evidence_url text,
  notes text,
  recorded_by text not null default 'staff',
  created_at timestamptz not null default now(),
  unique (metric_id, period_start, period_end, source)
);

alter table public.portal_social_posts
  add column if not exists growth_campaign_id uuid
    references public.growth_campaigns(id) on delete set null,
  add column if not exists growth_asset_id uuid
    references public.growth_assets(id) on delete set null,
  add column if not exists growth_content_key text;

create unique index if not exists portal_social_posts_growth_content_unique
  on public.portal_social_posts(growth_campaign_id, growth_content_key)
  where growth_campaign_id is not null and growth_content_key is not null;

create index if not exists growth_audits_client_created_idx
  on public.growth_audits(client_id, created_at desc);
create index if not exists growth_opportunities_audit_score_idx
  on public.growth_opportunities(audit_id, priority_score desc);
create index if not exists growth_campaigns_client_created_idx
  on public.growth_campaigns(client_id, created_at desc);
create index if not exists growth_measurements_metric_period_idx
  on public.growth_measurements(metric_id, period_end desc);

alter table public.growth_audits enable row level security;
alter table public.growth_audit_pages enable row level security;
alter table public.growth_opportunities enable row level security;
alter table public.growth_campaigns enable row level security;
alter table public.growth_assets enable row level security;
alter table public.growth_metrics enable row level security;
alter table public.growth_measurements enable row level security;

comment on table public.growth_audits is
  'Evidence-preserving website audits created by the 8E Growth OS.';
comment on table public.growth_opportunities is
  'Deterministically scored interventions derived from audit evidence.';
comment on table public.growth_campaigns is
  'Human-governed campaign plans generated from accepted opportunities.';
comment on table public.growth_assets is
  'Versioned, template-rendered campaign graphics with immutable approval state.';
