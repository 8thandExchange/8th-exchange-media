import { getPortalDb } from "@/lib/portal/db";
import { normalizeAdAccountId, type MetaAuth } from "@/lib/meta";
import type { ChecklistState } from "@/lib/portal/checklist";

export type RequestStatus = "new" | "in_progress" | "in_review" | "delivered" | "closed";
export type RequestPriority = "standard" | "rush";
export type UpdateAuthor = "client" | "staff" | "system";

export const REQUEST_STATUSES: { value: RequestStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "in_progress", label: "In progress" },
  { value: "in_review", label: "In review" },
  { value: "delivered", label: "Delivered" },
  { value: "closed", label: "Closed" },
];

export function statusLabel(status: RequestStatus): string {
  return REQUEST_STATUSES.find((s) => s.value === status)?.label ?? status;
}

export interface PortalClient {
  id: string;
  company: string;
  contact_name: string;
  email: string;
  active: boolean;
  brand_notes: string | null;
  /** GHL sub-account (location) id; null until the client is connected. */
  ghl_location_id: string | null;
  /* Provisioning profile — what a GHL sub-account setup asks for. */
  phone: string | null;
  website: string | null;
  address: string | null;
  socials: Record<string, string>;
  /** Stripe holds the actual payment method; we store only the reference. */
  stripe_customer_id: string | null;
  /** Digital-presence checklist progress; canonical items in lib/portal/checklist. */
  onboarding_checklist: ChecklistState;
  created_at: string;
}

export interface PortalRequest {
  id: string;
  client_id: string;
  title: string;
  service_type: string;
  brief: string;
  priority: RequestPriority;
  status: RequestStatus;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface RequestUpdate {
  id: string;
  request_id: string;
  author: UpdateAuthor;
  body: string;
  created_at: string;
}

export interface RequestFile {
  id: string;
  request_id: string;
  label: string;
  url: string;
  created_at: string;
}

function throwIfError(error: { message: string } | null): void {
  if (error) throw new Error(error.message);
}

/* ── Clients ─────────────────────────────────────── */

export async function getClientByEmail(email: string): Promise<PortalClient | null> {
  const { data, error } = await getPortalDb()
    .from("portal_clients")
    .select("*")
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();
  throwIfError(error);
  return data;
}

export async function getClientById(id: string): Promise<PortalClient | null> {
  const { data, error } = await getPortalDb()
    .from("portal_clients")
    .select("id, company, contact_name, email, active, brand_notes, ghl_location_id, phone, website, address, socials, stripe_customer_id, onboarding_checklist, created_at")
    .eq("id", id)
    .maybeSingle();
  throwIfError(error);
  return data;
}

export async function listClients(): Promise<PortalClient[]> {
  const { data, error } = await getPortalDb()
    .from("portal_clients")
    .select("id, company, contact_name, email, active, brand_notes, ghl_location_id, phone, website, address, socials, stripe_customer_id, onboarding_checklist, created_at")
    .order("company");
  throwIfError(error);
  return data ?? [];
}

export async function createPortalClient(input: {
  company: string;
  contactName: string;
  email: string;
  brandNotes?: string;
  phone?: string | null;
  website?: string | null;
  socials?: Record<string, string>;
}): Promise<PortalClient> {
  const { data, error } = await getPortalDb()
    .from("portal_clients")
    .insert({
      company: input.company,
      contact_name: input.contactName,
      email: input.email.trim().toLowerCase(),
      brand_notes: input.brandNotes ?? null,
      phone: input.phone ?? null,
      website: input.website ?? null,
      socials: input.socials ?? {},
    })
    .select("id, company, contact_name, email, active, brand_notes, ghl_location_id, phone, website, address, socials, stripe_customer_id, onboarding_checklist, created_at")
    .single();
  throwIfError(error);
  return data!;
}

export async function updateClientProfile(
  clientId: string,
  fields: {
    phone?: string | null;
    website?: string | null;
    address?: string | null;
    socials?: Record<string, string>;
    contactName?: string;
    company?: string;
  }
): Promise<void> {
  const update: Record<string, unknown> = {};
  if (fields.phone !== undefined) update.phone = fields.phone;
  if (fields.website !== undefined) update.website = fields.website;
  if (fields.address !== undefined) update.address = fields.address;
  if (fields.socials !== undefined) update.socials = fields.socials;
  if (fields.contactName !== undefined) update.contact_name = fields.contactName;
  if (fields.company !== undefined) update.company = fields.company;
  if (Object.keys(update).length === 0) return;
  const { error } = await getPortalDb().from("portal_clients").update(update).eq("id", clientId);
  throwIfError(error);
}

/** Merge checklist entries into the stored state (read-modify-write). */
export async function updateClientChecklist(
  clientId: string,
  entries: ChecklistState
): Promise<void> {
  const db = getPortalDb();
  const { data, error } = await db
    .from("portal_clients")
    .select("onboarding_checklist")
    .eq("id", clientId)
    .maybeSingle();
  throwIfError(error);
  const merged = { ...((data?.onboarding_checklist as ChecklistState) ?? {}), ...entries };
  const { error: updateError } = await db
    .from("portal_clients")
    .update({ onboarding_checklist: merged })
    .eq("id", clientId);
  throwIfError(updateError);
}

export async function setClientStripeCustomer(clientId: string, customerId: string): Promise<void> {
  const { error } = await getPortalDb()
    .from("portal_clients")
    .update({ stripe_customer_id: customerId })
    .eq("id", clientId);
  throwIfError(error);
}

/* ── Client GHL sub-accounts ─────────────────────── */

/**
 * The client's own GHL credentials, for running campaigns in *their*
 * sub-account. Server-only: the token must never reach the browser.
 * Returns null when the client has no GHL connection configured.
 */
export async function getClientGhlAuth(
  clientId: string
): Promise<{ token: string; locationId: string } | null> {
  const { data, error } = await getPortalDb()
    .from("portal_clients")
    .select("ghl_location_id, ghl_api_token")
    .eq("id", clientId)
    .maybeSingle();
  throwIfError(error);
  if (!data?.ghl_location_id || !data.ghl_api_token) return null;
  return { token: data.ghl_api_token, locationId: data.ghl_location_id };
}

/** Set or clear (both null) a client's GHL sub-account credentials. */
export async function setClientGhl(
  clientId: string,
  locationId: string | null,
  apiToken: string | null
): Promise<void> {
  const { error } = await getPortalDb()
    .from("portal_clients")
    .update({ ghl_location_id: locationId, ghl_api_token: apiToken })
    .eq("id", clientId);
  throwIfError(error);
}

/* ── Client Meta ad accounts ─────────────────────── */

export interface ClientMetaConnection {
  pixelId: string | null;
  adAccountId: string | null;
  businessId: string | null;
  hasToken: boolean;
}

function isMissingMetaColumnError(error: { message?: string; code?: string } | null): boolean {
  if (!error) return false;
  const message = (error.message ?? "").toLowerCase();
  return (
    error.code === "42703" ||
    message.includes("does not exist") ||
    message.includes("meta_pixel_id") ||
    message.includes("meta_ad_account_id") ||
    message.includes("meta_access_token")
  );
}

/**
 * Public (staff-safe) Meta connection status. Never includes the token.
 * Returns null when the row is missing, or when the migration hasn't run.
 */
export async function getClientMetaConnection(
  clientId: string
): Promise<ClientMetaConnection | null> {
  const { data, error } = await getPortalDb()
    .from("portal_clients")
    .select("meta_pixel_id, meta_ad_account_id, meta_business_id, meta_access_token")
    .eq("id", clientId)
    .maybeSingle();
  if (isMissingMetaColumnError(error)) return null;
  throwIfError(error);
  if (!data) return null;
  return {
    pixelId: data.meta_pixel_id ?? null,
    adAccountId: data.meta_ad_account_id ?? null,
    businessId: data.meta_business_id ?? null,
    hasToken: Boolean(data.meta_access_token),
  };
}

/** Server-only credentials. Null when the client has no Meta connection. */
export async function getClientMetaAuth(clientId: string): Promise<MetaAuth | null> {
  const { data, error } = await getPortalDb()
    .from("portal_clients")
    .select("meta_pixel_id, meta_ad_account_id, meta_access_token, meta_business_id")
    .eq("id", clientId)
    .maybeSingle();
  if (isMissingMetaColumnError(error)) return null;
  throwIfError(error);
  if (!data?.meta_ad_account_id || !data.meta_access_token) return null;
  return {
    accessToken: data.meta_access_token,
    adAccountId: normalizeAdAccountId(data.meta_ad_account_id),
    pixelId: data.meta_pixel_id ?? null,
    businessId: data.meta_business_id ?? null,
  };
}

export async function listClientsMetaStatus(): Promise<
  { id: string; company: string; active: boolean; connected: boolean; pixelId: string | null }[]
> {
  const { data, error } = await getPortalDb()
    .from("portal_clients")
    .select("id, company, active, meta_ad_account_id, meta_access_token, meta_pixel_id")
    .order("company");
  if (isMissingMetaColumnError(error)) return [];
  throwIfError(error);
  return (data ?? []).map((row) => ({
    id: row.id,
    company: row.company,
    active: row.active,
    connected: Boolean(row.meta_ad_account_id && row.meta_access_token),
    pixelId: row.meta_pixel_id ?? null,
  }));
}

/** Set or clear a client's Meta ads credentials. Token is write-only. */
export async function setClientMeta(
  clientId: string,
  fields: {
    adAccountId: string | null;
    accessToken: string | null;
    pixelId?: string | null;
    businessId?: string | null;
  }
): Promise<void> {
  const update: Record<string, unknown> = {
    meta_ad_account_id: fields.adAccountId,
    meta_access_token: fields.accessToken,
  };
  if (fields.pixelId !== undefined) update.meta_pixel_id = fields.pixelId;
  if (fields.businessId !== undefined) update.meta_business_id = fields.businessId;

  const { error } = await getPortalDb().from("portal_clients").update(update).eq("id", clientId);
  if (isMissingMetaColumnError(error)) {
    throw new Error(
      "The Meta columns are not on portal_clients yet. Run supabase/migrations/20260818_portal_clients_meta.sql in the 8th-exchange-media Supabase project (SQL editor or `supabase db push`), then try again."
    );
  }
  throwIfError(error);
}

export async function setClientMetaPixel(clientId: string, pixelId: string | null): Promise<void> {
  const { error } = await getPortalDb()
    .from("portal_clients")
    .update({ meta_pixel_id: pixelId })
    .eq("id", clientId);
  if (isMissingMetaColumnError(error)) {
    throw new Error(
      "The Meta columns are not on portal_clients yet. Run supabase/migrations/20260818_portal_clients_meta.sql in the 8th-exchange-media Supabase project, then try again."
    );
  }
  throwIfError(error);
}

/* ── Requests ────────────────────────────────────── */

export async function listRequestsForClient(clientId: string): Promise<PortalRequest[]> {
  const { data, error } = await getPortalDb()
    .from("portal_requests")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  throwIfError(error);
  return data ?? [];
}

export async function listAllRequests(): Promise<
  (PortalRequest & { portal_clients: Pick<PortalClient, "company" | "contact_name"> })[]
> {
  const { data, error } = await getPortalDb()
    .from("portal_requests")
    .select("*, portal_clients(company, contact_name)")
    .order("created_at", { ascending: false });
  throwIfError(error);
  return data ?? [];
}

export async function getRequest(id: string): Promise<PortalRequest | null> {
  const { data, error } = await getPortalDb()
    .from("portal_requests")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  throwIfError(error);
  return data;
}

export async function createRequest(input: {
  clientId: string;
  title: string;
  serviceType: string;
  brief: string;
  priority: RequestPriority;
  dueDate?: string;
}): Promise<PortalRequest> {
  const { data, error } = await getPortalDb()
    .from("portal_requests")
    .insert({
      client_id: input.clientId,
      title: input.title,
      service_type: input.serviceType,
      brief: input.brief,
      priority: input.priority,
      due_date: input.dueDate ?? null,
    })
    .select("*")
    .single();
  throwIfError(error);
  return data!;
}

export async function updateRequestStatus(id: string, status: RequestStatus): Promise<void> {
  const { error } = await getPortalDb()
    .from("portal_requests")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  throwIfError(error);
}

/* ── Updates & files ─────────────────────────────── */

export async function listUpdates(requestId: string): Promise<RequestUpdate[]> {
  const { data, error } = await getPortalDb()
    .from("portal_request_updates")
    .select("*")
    .eq("request_id", requestId)
    .order("created_at", { ascending: true });
  throwIfError(error);
  return data ?? [];
}

export async function addUpdate(input: {
  requestId: string;
  author: UpdateAuthor;
  body: string;
}): Promise<RequestUpdate> {
  const { data, error } = await getPortalDb()
    .from("portal_request_updates")
    .insert({ request_id: input.requestId, author: input.author, body: input.body })
    .select("*")
    .single();
  throwIfError(error);
  return data!;
}

export async function listFiles(requestId: string): Promise<RequestFile[]> {
  const { data, error } = await getPortalDb()
    .from("portal_request_files")
    .select("*")
    .eq("request_id", requestId)
    .order("created_at", { ascending: true });
  throwIfError(error);
  return data ?? [];
}

export async function addFile(input: {
  requestId: string;
  label: string;
  url: string;
}): Promise<RequestFile> {
  const { data, error } = await getPortalDb()
    .from("portal_request_files")
    .insert({ request_id: input.requestId, label: input.label, url: input.url })
    .select("*")
    .single();
  throwIfError(error);
  return data!;
}

/* ── Onboarding leads ────────────────────────────── */

export type LeadStatus = "new" | "contacted" | "converted" | "archived";

export interface OnboardingLead {
  id: string;
  company: string;
  contact_name: string;
  email: string;
  phone: string | null;
  website: string | null;
  industry: string | null;
  goals: string[];
  services: string[];
  socials: Record<string, string>;
  brand_assets: string | null;
  budget: string | null;
  timeline: string | null;
  notes: string | null;
  status: LeadStatus;
  client_id: string | null;
  created_at: string;
}

export async function createLead(input: {
  company: string;
  contactName: string;
  email: string;
  phone?: string;
  website?: string;
  industry?: string;
  goals: string[];
  services: string[];
  socials: Record<string, string>;
  brandAssets?: string;
  budget?: string;
  timeline?: string;
  notes?: string;
}): Promise<OnboardingLead> {
  const { data, error } = await getPortalDb()
    .from("onboarding_leads")
    .insert({
      company: input.company,
      contact_name: input.contactName,
      email: input.email.trim().toLowerCase(),
      phone: input.phone ?? null,
      website: input.website ?? null,
      industry: input.industry ?? null,
      goals: input.goals,
      services: input.services,
      socials: input.socials,
      brand_assets: input.brandAssets ?? null,
      budget: input.budget ?? null,
      timeline: input.timeline ?? null,
      notes: input.notes ?? null,
    })
    .select("*")
    .single();
  throwIfError(error);
  return data!;
}

export async function listLeads(): Promise<OnboardingLead[]> {
  const { data, error } = await getPortalDb()
    .from("onboarding_leads")
    .select("*")
    .order("created_at", { ascending: false });
  throwIfError(error);
  return data ?? [];
}

export async function getLead(id: string): Promise<OnboardingLead | null> {
  const { data, error } = await getPortalDb()
    .from("onboarding_leads")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  throwIfError(error);
  return data;
}

export async function updateLead(
  id: string,
  patch: { status?: LeadStatus; client_id?: string }
): Promise<void> {
  const { error } = await getPortalDb().from("onboarding_leads").update(patch).eq("id", id);
  throwIfError(error);
}

/* ── Brand kits ──────────────────────────────────── */

export interface BrandColor {
  name: string;
  hex: string;
  usage?: string;
}

export interface BrandLink {
  label: string;
  url: string;
}

/**
 * Machine-readable brand system for a client. Every field is optional so
 * kits can grow over time; consumers (AI tools, templates, integrations)
 * should treat missing fields as "not yet defined".
 */
export interface BrandKit {
  tagline?: string;
  mission?: string;
  audience?: string;
  voiceTone?: string;
  voiceDos?: string[];
  voiceDonts?: string[];
  colors?: BrandColor[];
  headingFont?: string;
  bodyFont?: string;
  typographyNotes?: string;
  logos?: BrandLink[];
  assets?: BrandLink[];
  socials?: Record<string, string>;
  keywords?: string[];
  competitors?: string[];
  notes?: string;
}

export async function getBrandKit(clientId: string): Promise<BrandKit | null> {
  const { data, error } = await getPortalDb()
    .from("brand_kits")
    .select("kit")
    .eq("client_id", clientId)
    .maybeSingle();
  throwIfError(error);
  return (data?.kit as BrandKit) ?? null;
}

export async function upsertBrandKit(clientId: string, kit: BrandKit): Promise<void> {
  const { error } = await getPortalDb()
    .from("brand_kits")
    .upsert(
      { client_id: clientId, kit, updated_at: new Date().toISOString() },
      { onConflict: "client_id" }
    );
  throwIfError(error);
}
