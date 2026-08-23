import type { ChecklistState, ClientType } from "@/lib/portal/checklist";

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
  phone: string | null;
  website: string | null;
  address: string | null;
  socials: Record<string, string>;
  stripe_customer_id: string | null;
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

export function isComplianceAnswered(
  client: Pick<PortalClient, "baa_status" | "phi_permitted" | "compliance_answered_at">
): boolean {
  return Boolean(client.compliance_answered_at) && client.baa_status !== null && client.phi_permitted !== null;
}

export interface BrandColor {
  name: string;
  hex: string;
  usage?: string;
}

export interface BrandLink {
  label: string;
  url: string;
}

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
  services?: string[];
  priceAnchor?: string;
  turnaround?: string;
  primaryConversion?: string;
}
