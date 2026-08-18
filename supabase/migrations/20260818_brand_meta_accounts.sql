-- Per-client Meta Ads connections for the studio Ads desk.
-- Agency Pixel / tokens stay in Vercel env (same split as GHL).
-- Apply in the 8th-exchange-media Supabase SQL editor.
-- RLS on, no policies: the service-role client in lib/portal/db.ts is the only way in.

create table if not exists public.brand_meta_accounts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null unique references public.portal_clients (id) on delete cascade,
  pixel_id text,
  dataset_id text,
  ad_account_id text,
  business_id text,
  capi_token text,
  system_user_token text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.brand_meta_accounts enable row level security;
