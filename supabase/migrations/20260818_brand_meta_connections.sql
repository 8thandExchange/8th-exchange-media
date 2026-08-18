-- Per-brand Meta Ads connection (pixel, ad account, page, system-user token).
-- client_id NULL = 8E Media (the agency). Everyone else is a portal client.
-- RLS on, no policies: the service-role client in lib/portal/db.ts is the only way in.

create table if not exists public.brand_meta_connections (
  id uuid primary key default gen_random_uuid(),
  client_id uuid unique references public.portal_clients (id) on delete cascade,
  pixel_id text,
  ad_account_id text,
  business_id text,
  page_id text,
  access_token text,
  domain_verification text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Postgres UNIQUE allows many NULLs; we want exactly one agency row.
create unique index if not exists brand_meta_connections_agency_uidx
  on public.brand_meta_connections ((true))
  where client_id is null;

alter table public.brand_meta_connections enable row level security;

comment on table public.brand_meta_connections is
  'Meta Business credentials per brand. access_token is server-only; never expose to the browser.';
