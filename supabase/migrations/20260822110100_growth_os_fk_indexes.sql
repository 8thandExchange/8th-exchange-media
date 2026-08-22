-- Cover foreign keys reported by the Supabase performance advisor.
create index if not exists growth_opportunities_audit_page_idx
  on public.growth_opportunities(audit_page_id);
create index if not exists growth_opportunities_client_idx
  on public.growth_opportunities(client_id);
create index if not exists growth_campaigns_opportunity_idx
  on public.growth_campaigns(opportunity_id);
create index if not exists portal_social_posts_growth_asset_idx
  on public.portal_social_posts(growth_asset_id);
