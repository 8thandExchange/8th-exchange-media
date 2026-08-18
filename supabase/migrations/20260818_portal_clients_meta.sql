-- Per-brand Meta (Facebook) ads connection.
-- Tokens are read only by the service-role client (lib/portal/db.ts).
-- RLS stays on with no policies — same posture as ghl_api_token.
-- Apply in the 8th-exchange-media Supabase project; git push does not.

alter table portal_clients
  add column if not exists meta_pixel_id text,
  add column if not exists meta_ad_account_id text,
  add column if not exists meta_access_token text,
  add column if not exists meta_business_id text;

comment on column portal_clients.meta_pixel_id is
  'Meta Pixel / Dataset id for this brand. Safe to show to staff.';
comment on column portal_clients.meta_ad_account_id is
  'Meta ad account id (with or without act_ prefix).';
comment on column portal_clients.meta_access_token is
  'System-user or user token. Server-only — never send to the browser.';
comment on column portal_clients.meta_business_id is
  'Optional Meta Business Portfolio id, for display and support.';
