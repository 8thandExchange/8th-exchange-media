import { getPortalDb } from "@/lib/portal/db";

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

export async function getClientByEmail(email: string): Promise<
  (PortalClient & { access_code_hash: string }) | null
> {
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
    .select("id, company, contact_name, email, active, brand_notes, created_at")
    .eq("id", id)
    .maybeSingle();
  throwIfError(error);
  return data;
}

export async function listClients(): Promise<PortalClient[]> {
  const { data, error } = await getPortalDb()
    .from("portal_clients")
    .select("id, company, contact_name, email, active, brand_notes, created_at")
    .order("company");
  throwIfError(error);
  return data ?? [];
}

export async function createPortalClient(input: {
  company: string;
  contactName: string;
  email: string;
  accessCodeHash: string;
  brandNotes?: string;
}): Promise<PortalClient> {
  const { data, error } = await getPortalDb()
    .from("portal_clients")
    .insert({
      company: input.company,
      contact_name: input.contactName,
      email: input.email.trim().toLowerCase(),
      access_code_hash: input.accessCodeHash,
      brand_notes: input.brandNotes ?? null,
    })
    .select("id, company, contact_name, email, active, brand_notes, created_at")
    .single();
  throwIfError(error);
  return data!;
}

export async function setClientAccessCode(clientId: string, accessCodeHash: string): Promise<void> {
  const { error } = await getPortalDb()
    .from("portal_clients")
    .update({ access_code_hash: accessCodeHash })
    .eq("id", clientId);
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
