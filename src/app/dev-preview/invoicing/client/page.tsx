import { notFound } from "next/navigation";
import { Inter } from "next/font/google";
import { BrandKitEditor } from "@/components/portal/BrandKitEditor";
import { ClientProvisioningCard } from "@/components/portal/ClientProvisioningCard";
import { GhlSettingsForm } from "@/components/portal/GhlSettingsForm";
import { OnboardingChecklist } from "@/components/portal/OnboardingChecklist";
import type { BrandKit, PortalClient } from "@/lib/portal/service";
import "../../../invoicing/invoicing.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

/**
 * DEV-only design preview of the staff client page using the Line of Duty
 * Medical kit. 404s in production builds.
 */
const SAMPLE_CLIENT: PortalClient = {
  id: "preview-lodm",
  company: "Line of Duty Medical",
  contact_name: "Line of Duty Medical",
  email: "hello@lineofdutymedical.com",
  active: true,
  brand_notes:
    "Platform launch, not a local funnel. BLOCKED pending federal ethics office clearance. Client type is Platform — GBP is not appropriate for a suite address with no patient-facing operation.",
  ghl_location_id: "CIHGHZvjoOJ9Rv0YhEN9",
  ghl_token_last4: "9Rv0",
  ghl_token_scopes: "Social Planner, calendars, conversations",
  ghl_token_rotation_due: "2026-11-21",
  phone: null,
  website: "https://lineofdutymedical.com",
  address: null,
  socials: {
    instagram: "@lineofdutymedical",
    linkedin: "/company/line-of-duty-medical",
  },
  stripe_customer_id: null,
  onboarding_checklist: {
    "ghl-subaccount": {
      done: true,
      value: "CIHGHZvjoOJ9Rv0YhEN9",
      completedBy: "Troy",
      completedAt: "2026-08-18T15:00:00.000Z",
      note: "Sub-account exists. Location ID + PIT still to be treated as encrypted.",
    },
  },
  client_type: "platform",
  legal_name: null,
  ein: null,
  entity_type: null,
  registered_agent: null,
  baa_status: "pending",
  subprocessors: ["Go High Level / LeadConnector", "Stripe", "Resend", "Vercel", "Supabase"],
  phi_permitted: false,
  compliance_answered_at: "2026-08-23T15:00:00.000Z",
  created_at: "2026-06-19T00:00:00.000Z",
};

const SAMPLE_KIT: BrandKit = {
  tagline: "The evidence your file is missing.",
  mission:
    "Line of Duty Medical produces independent medical opinions, nexus letters, and Disability Benefits Questionnaires for veterans and their representatives. Every opinion is written personally by a board-certified emergency physician and Army veteran who reviews the record himself. We do not represent claims and we do not promise outcomes. We produce medical evidence built to survive adjudication.",
  audience:
    "Primary: VA-accredited attorneys and claims agents who need IMOs and rebuttal opinions for appeals and higher-level reviews. Secondary: Veterans with a denied or under-rated claim who already know what a nexus letter is. Tertiary: VSOs as a referral channel. Explicitly not: veterans at the start of an initial claim.",
  services: [
    "Independent medical opinions (IMOs)",
    "Nexus letters",
    "Disability Benefits Questionnaires (DBQs)",
    "Rebuttal opinions to C&P exams",
  ],
  priceAnchor: "Above Xterra ($500 flat), below Telemedica (well over $1,000). Sell the named-physician signature.",
  turnaround: "Named in public once capacity and ethics clearance allow. One physician signature is the constraint.",
  primaryConversion: "Attorney / claims-agent IMO request (repeat order). Not consumer initial-claim intake.",
  voiceTone:
    "A physician giving a straight read on a file. Clinical, specific, unhurried. Cites standards rather than asserting authority. Says no when the record does not support the opinion, and says why. Never sells hope.",
  voiceDos: [
    "Lead with independent medical opinion; use nexus letter as the recognized second term",
    "State credentials as board-certified emergency physician and Army veteran",
    "State plainly that no outcome is guaranteed and that a case may be declined",
    "Explain the reasoning standard being applied, such as at least as likely as not",
    "Say veteran, never client or case, in public copy",
    "Name the price and the turnaround in public",
  ],
  voiceDonts: [
    "Never promise a rating, a percentage, an increase, or an approval",
    "Never say we get veterans approved or any variant",
    "Never imply VA affiliation, endorsement, accreditation, or insider access",
    "Never reference the federal employer, the medical center, DHA, rank, unit, or any photo in uniform",
    "Never use countdown timers, scarcity, or limited-slot urgency",
    "Never use stock imagery of flags, eagles, silhouetted soldiers, or saluting",
  ],
  colors: [
    { name: "Record Navy", hex: "#101E33", usage: "primary, backgrounds and headers" },
    { name: "Service Gold", hex: "#C2A15A", usage: "accent only, rules and marks, never body text" },
    { name: "Manila", hex: "#E6DAC3", usage: "file-folder surface, cards and callouts" },
    { name: "Field Olive", hex: "#4B5240", usage: "secondary accent, stamps and labels" },
    { name: "Archive Black", hex: "#17181A", usage: "body text on light" },
    { name: "Bond Paper", hex: "#F7F3EA", usage: "page background" },
  ],
  headingFont: "Cormorant Garamond",
  bodyFont: "DM Sans",
  typographyNotes:
    "Headings in Cormorant Garamond 400, never bold. Body in DM Sans 400 at 17px minimum, line height 1.7. Third face JetBrains Mono for labels and stamps only.",
  socials: {
    instagram: "@lineofdutymedical",
    facebook: "@lineofdutymedical",
    linkedin: "/company/line-of-duty-medical",
    x: "@lodmedical",
    tiktok: "@lineofdutymedical",
    youtube: "@lineofdutymedical",
  },
  keywords: [
    "IMO provider for VA accredited attorneys",
    "do I need a nexus letter or a DBQ",
    "how much does a nexus letter cost",
    "what makes a nexus letter strong enough for the VA",
    "independent medical opinion VA claim",
    "nexus letter after VA denial",
  ],
  competitors: [
    "Telemedica — network model, premium pricing",
    "Prestige Veteran Medical Consulting — veteran-owned, attorney relationships",
    "Xterra Health — $500 flat fee, low price anchor",
  ],
  notes:
    "BLOCKED pending federal ethics office clearance. HIPAA: GHL BAA must be executed before intake. 5 CFR 2635.702: no use of official title. Capacity is the real constraint. Build the attorney channel, not a consumer funnel.",
};

export default function InvoicingClientPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <div className={`inv-shell ${inter.variable}`}>
      <div
        style={{
          background: "#18181b",
          color: "#fff",
          textAlign: "center",
          fontSize: 12,
          fontWeight: 500,
          padding: "6px 0",
        }}
      >
        Design preview — Line of Duty Medical sample data. Saves will 401.
      </div>
      <main className="inv-content" style={{ maxWidth: 960, margin: "0 auto", padding: "24px 20px 64px" }}>
        <h1 className="inv-page-title">{SAMPLE_CLIENT.company}</h1>
        <p className="inv-page-subtitle">
          Platform client. Compliance answered. Checklist unlocked. Offer object in the kit.
        </p>

        {SAMPLE_CLIENT.brand_notes ? (
          <div className="inv-notice inv-notice-warn" style={{ whiteSpace: "pre-wrap", marginTop: "1rem" }}>
            <strong>Onboarding notes:</strong> {SAMPLE_CLIENT.brand_notes}
          </div>
        ) : null}

        <div style={{ marginTop: "1rem" }}>
          <ClientProvisioningCard client={SAMPLE_CLIENT} cardOnFile={false} />
        </div>
        <div className="inv-card" style={{ marginTop: "1rem" }}>
          <GhlSettingsForm
            clientId={SAMPLE_CLIENT.id}
            connectedLocationId={SAMPLE_CLIENT.ghl_location_id}
            tokenLast4={SAMPLE_CLIENT.ghl_token_last4}
            scopes={SAMPLE_CLIENT.ghl_token_scopes}
            rotationDue={SAMPLE_CLIENT.ghl_token_rotation_due}
          />
        </div>
        <div style={{ marginTop: "1rem" }}>
          <OnboardingChecklist
            clientId={SAMPLE_CLIENT.id}
            initialState={SAMPLE_CLIENT.onboarding_checklist}
            clientType={SAMPLE_CLIENT.client_type}
            locked={false}
          />
        </div>
        <div className="inv-card" style={{ marginTop: "1rem" }}>
          <BrandKitEditor clientId={SAMPLE_CLIENT.id} initialKit={SAMPLE_KIT} />
        </div>
      </main>
    </div>
  );
}
