-- Client onboarding v2: legal entity, compliance gate, client type,
-- and GHL token metadata. The Private Integration token itself is
-- encrypted by the app (enc:v1: prefix) — this migration only adds
-- the fields that sit next to it.

alter table public.portal_clients
  add column if not exists client_type text not null default 'local',
  add column if not exists legal_name text,
  add column if not exists ein text,
  add column if not exists entity_type text,
  add column if not exists registered_agent text,
  add column if not exists baa_status text,
  add column if not exists subprocessors text[] not null default '{}',
  add column if not exists phi_permitted boolean,
  add column if not exists compliance_answered_at timestamptz,
  add column if not exists ghl_token_scopes text,
  add column if not exists ghl_token_rotation_due date,
  add column if not exists ghl_token_last4 text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'portal_clients_client_type_check'
  ) then
    alter table public.portal_clients
      add constraint portal_clients_client_type_check
      check (client_type in ('local', 'platform', 'b2b'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'portal_clients_baa_status_check'
  ) then
    alter table public.portal_clients
      add constraint portal_clients_baa_status_check
      check (baa_status is null or baa_status in ('not_required', 'pending', 'executed', 'declined'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'portal_clients_entity_type_check'
  ) then
    alter table public.portal_clients
      add constraint portal_clients_entity_type_check
      check (
        entity_type is null
        or entity_type in ('llc', 'c_corp', 's_corp', 'sole_prop', 'nonprofit', 'partnership', 'other')
      );
  end if;
end $$;

comment on column public.portal_clients.client_type is
  'local | platform | b2b — drives which onboarding checklist items render and which are required.';
comment on column public.portal_clients.ghl_token_last4 is
  'Last four characters of the PIT for masked display. The token itself is app-encrypted in ghl_api_token.';
comment on column public.portal_clients.ghl_token_rotation_due is
  'GHL private integration tokens do not expire. Rotation is a manual staff reminder.';
