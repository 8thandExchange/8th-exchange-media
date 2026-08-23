-- Automated GA4 measurements for the Growth OS (2026-08-23).
--
-- growth_measurements.source has allowed 'ga4' since growth_os_v1, but nothing
-- ever wrote it: every measurement in the system is typed in by a human through
-- the admin measurements endpoint. This adds the two pieces of configuration a
-- scheduled GA4 pull needs, and nothing else.
--
--   1. Which GA4 property belongs to a client (growth_ga4_properties).
--   2. Which GA4 metric feeds a given growth_metric (growth_metrics.ga4_metric).
--
-- A growth_metric with a null ga4_metric stays manual — this is additive and
-- changes no existing behaviour. The sync is opt-in per metric, which matters
-- because most of the Growth OS metrics (CAC, member count, revenue) come from
-- Stripe or GHL and must never be silently overwritten by an analytics number.

alter table public.growth_metrics
  add column if not exists ga4_metric text;

comment on column public.growth_metrics.ga4_metric is
  'GA4 Data API metric name (e.g. sessions, activeUsers) that feeds this metric. '
  'Null means the metric is maintained by hand. Validated against an allowlist in '
  'src/lib/growth/ga4.ts before any request is built.';

create table if not exists public.growth_ga4_properties (
  client_id uuid primary key references public.portal_clients(id) on delete cascade,
  property_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- GA4 property ids are numeric strings. Constrained here so a malformed id
  -- fails at write time rather than becoming part of a request URL later.
  constraint growth_ga4_properties_property_id_numeric
    check (property_id ~ '^[0-9]+$')
);

comment on table public.growth_ga4_properties is
  'Maps an 8E client to the GA4 property the Growth OS reads its measurements from. '
  'One property per client; the service account must have Viewer on it.';

alter table public.growth_ga4_properties enable row level security;

-- No policies: this table is reached only through the service-role key in
-- src/lib/portal/db.ts, matching every other Growth OS table.
