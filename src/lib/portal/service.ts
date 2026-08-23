import { getPortalDb } from "@/lib/portal/db";
import {
  isValidClientType,
  type ChecklistState,
  type ClientType,
} from "@/lib/portal/checklist";
import { decryptSecret, encryptSecret, isEncryptedSecret, secretLast4 } from "@/lib/portal/crypto";

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

export type EntityType =
  | "llc"
  | "c_corp"
  | "s_corp"
  | "sole_prop"
  | "nonprofit"
  | "partnership"
  | "other";

export type BaaStatus = "not_required" | "pending" | "executed" | "declined";

export const ENTITY_TYPES: { value: EntityType; label: string }[] = [
  { value: "llc", label: "LLC" },
  { value: "c_corp", label: "C-Corp" },
  { value: "s_corp", label: "S-Corp" },
  { value: "sole_prop", label: "Sole proprietor" },
  { value: "nonprofit", label: "Nonprofit" },
  { value: "partnership", label: "Partnership" },
  { value: "other", label: "Other" },
];

export const BAA_STATUSES: { value: BaaStatus; label: string }[] = [
  { value: "not_required", label: "Not required" },
  { value: "pending", label: "Pending — must execute before intake" },
  { value: "executed", label: "Executed" },
  { value: "declined", label: "Declined / will not sign" },
];

export interface PortalClient {
  id: string;
  company: string;
  contact_name: string;
  email: string;
  active: boolean;
  brand_notes: string | null;
  /** GHL sub-account (location) id; null until the client is connected. */
  ghl_location_id: string | null;
  /** Masked PIT last-four. The token itself never leaves the server. */
  ghl_token_last4: string | null;
  ghl_token_scopes: string | null;
  ghl_token_rotation_due: string | null;
  /* Provisioning profile — what a GHL sub-account setup asks for. */
  phone: string | null;
  website: string | null;
  address: string | null;
  socials: Record<string, string>;
  /** Stripe holds the actual payment method; we store only the reference. */
  stripe_customer_id: string | null;
  /** Digital-presence checklist progress; canonical items in lib/portal/checklist. */
  onboarding_checklist: ChecklistState;
  client_type: ClientType;
  legal_name: string | null;
  ein: string | null;
  entity_type: EntityType | null;
  registered_agent: string | null;
  baa_status: BaaStatus | null;
  subprocessors: string[];
  phi_permitted: boolean | null;
  compliance_answered_at: string | null;
  created_at: string;
}

const CLIENT_COLUMNS =
  "id, company, contact_name, email, active, brand_notes, ghl_location_id, ghl_token_last4, ghl_token_scopes, ghl_token_rotation_due, phone, website, address, socials, stripe_customer_id, onboarding_checklist, client_type, legal_name, ein, entity_type, registered_agent, baa_status, subprocessors, phi_permitted, compliance_answered_at, created_at";

export function isComplianceAnswered(
  client: Pick<PortalClient, "baa_status" | "phi_permitted" | "compliance_answered_at">
): boolean {
  return Boolean(client.compliance_answered_at) && client.baa_status !== null && client.phi_permitted !== null;
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

function normalizeClient(row: PortalClient | null): PortalClient | null {
  if (!row) return null;
  return {
    ...row,
    client_type: isValidClientType(row.client_type) ? row.client_type : "local",
    socials: row.socials ?? {},
    onboarding_checklist: row.onboarding_checklist ?? {},
    subprocessors: row.subprocessors ?? [],
    ghl_token_last4: row.ghl_token_last4 ?? null,
    ghl_token_scopes: row.ghl_token_scopes ?? null,
    ghl_token_rotation_due: row.ghl_token_rotation_due ?? null,
  };
}

export async function getClientByEmail(email: string): Promise<PortalClient | null> {
  const { data, error } = await getPortalDb()
    .from("portal_clients")
    .select(CLIENT_COLUMNS)
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();
  throwIfError(error);
  return normalizeClient(data);
}

export async function getClientById(id: string): Promise<PortalClient | null> {
  const { data, error } = await getPortalDb()
    .from("portal_clients")
    .select(CLIENT_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  throwIfError(error);
  return normalizeClient(data);
}

export async function listClients(): Promise<PortalClient[]> {
  const { data, error } = await getPortalDb()
    .from("portal_clients")
    .select(CLIENT_COLUMNS)
    .order("company");
  throwIfError(error);
  return (data ?? []).map((row) => normalizeClient(row)!);
}

export async function createPortalClient(input: {
  company: string;
  contactName: string;
  email: string;
  brandNotes?: string;
  phone?: string | null;
  website?: string | null;
  socials?: Record<string, string>;
  clientType?: ClientType;
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
      client_type: input.clientType ?? "local",
    })
    .select(CLIENT_COLUMNS)
    .single();
  throwIfError(error);
  return normalizeClient(data)!;
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
    clientType?: ClientType;
    legalName?: string | null;
    ein?: string | null;
    entityType?: EntityType | null;
    registeredAgent?: string | null;
    baaStatus?: BaaStatus | null;
    subprocessors?: string[];
    phiPermitted?: boolean | null;
  }
): Promise<void> {
  const update: Record<string, unknown> = {};
  if (fields.phone !== undefined) update.phone = fields.phone;
  if (fields.website !== undefined) update.website = fields.website;
  if (fields.address !== undefined) update.address = fields.address;
  if (fields.socials !== undefined) update.socials = fields.socials;
  if (fields.contactName !== undefined) update.contact_name = fields.contactName;
  if (fields.company !== undefined) update.company = fields.company;
  if (fields.clientType !== undefined) update.client_type = fields.clientType;
  if (fields.legalName !== undefined) update.legal_name = fields.legalName;
  if (fields.ein !== undefined) update.ein = fields.ein;
  if (fields.entityType !== undefined) update.entity_type = fields.entityType;
  if (fields.registeredAgent !== undefined) update.registered_agent = fields.registeredAgent;
  if (fields.baaStatus !== undefined) update.baa_status = fields.baaStatus;
  if (fields.subprocessors !== undefined) update.subprocessors = fields.subprocessors;
  if (fields.phiPermitted !== undefined) update.phi_permitted = fields.phiPermitted;
  if (
    fields.baaStatus !== undefined ||
    fields.phiPermitted !== undefined ||
    fields.subprocessors !== undefined
  ) {
    const answered = fields.baaStatus != null && fields.phiPermitted != null;
    update.compliance_answered_at = answered ? new Date().toISOString() : null;
  }
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
  const current = (data?.onboarding_checklist as ChecklistState) ?? {};
  const merged: ChecklistState = { ...current };
  for (const [key, entry] of Object.entries(entries)) {
    merged[key] = { ...current[key], ...entry };
  }
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
  const token = decryptSecret(data.ghl_api_token);
  if (!isEncryptedSecret(data.ghl_api_token)) {
    const { error: migrateError } = await getPortalDb()
      .from("portal_clients")
      .update({
        ghl_api_token: encryptSecret(token),
        ghl_token_last4: secretLast4(token),
      })
      .eq("id", clientId);
    if (migrateError) {
      console.error("Could not encrypt stored GHL token for", clientId, migrateError.message);
    }
  }
  return { token, locationId: data.ghl_location_id };
}

/** Set or clear (both null) a client's GHL sub-account credentials. Token is encrypted at rest. */
export async function setClientGhl(
  clientId: string,
  locationId: string | null,
  apiToken: string | null,
  extras?: { scopes?: string | null; rotationDue?: string | null }
): Promise<void> {
  const update: Record<string, unknown> = {
    ghl_location_id: locationId,
    ghl_api_token: apiToken ? encryptSecret(apiToken) : null,
    ghl_token_last4: apiToken ? secretLast4(apiToken) : null,
  };
  if (extras?.scopes !== undefined) update.ghl_token_scopes = extras.scopes;
  if (extras?.rotationDue !== undefined) update.ghl_token_rotation_due = extras.rotationDue;
  if (!apiToken) {
    update.ghl_token_scopes = null;
    update.ghl_token_rotation_due = null;
  }
  const { error } = await getPortalDb().from("portal_clients").update(update).eq("id", clientId);
  throwIfError(error);
}

/** Update PIT scopes / rotation without rotating the token. */
export async function updateClientGhlMeta(
  clientId: string,
  extras: { scopes?: string | null; rotationDue?: string | null }
): Promise<void> {
  const update: Record<string, unknown> = {};
  if (extras.scopes !== undefined) update.ghl_token_scopes = extras.scopes;
  if (extras.rotationDue !== undefined) update.ghl_token_rotation_due = extras.rotationDue;
  if (Object.keys(update).length === 0) return;
  const { error } = await getPortalDb().from("portal_clients").update(update).eq("id", clientId);
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
  /** Offer object — the fields copy cannot be written without. */
  services?: string[];
  priceAnchor?: string;
  turnaround?: string;
  primaryConversion?: string;
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
