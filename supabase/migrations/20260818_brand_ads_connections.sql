-- Per-brand Meta (and later Google) ad plumbing.
-- client_id null would be agency; agency credentials stay in env instead
-- (same pattern as GHL_API_TOKEN). RLS on, no policies — service-role only.

create table if not exists brand_ads_connections (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references portal_clients(id) on delete cascade,
  platform text not null default 'meta',
  pixel_id text,
  ad_account_id text,
  business_id text,
  page_id text,
  capi_token text,
  ads_token text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint brand_ads_connections_platform_check check (platform in ('meta', 'google'))
);

create unique index if not exists brand_ads_connections_agency_platform
  on brand_ads_connections (platform)
  where client_id is null;

create unique index if not exists brand_ads_connections_client_platform
  on brand_ads_connections (client_id, platform)
  where client_id is not null;

alter table brand_ads_connections enable row level security;
