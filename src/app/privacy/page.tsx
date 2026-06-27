import { PageShell } from "@/components/site/PageShell";
import { PageHero } from "@/components/site/PageHero";
import { LegalProse } from "@/components/legal/LegalProse";
import { CONTACT_EMAIL } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";

const SECTIONS = [
  {
    title: "Overview",
    paragraphs: [
      "8th & Exchange Media, LLC (\"8E Media,\" \"we,\" \"us\") operates 8emedia.com and related services. This Privacy Policy explains how we collect, use, and protect information when you visit our website, contact us, or interact with our invoicing and payment tools.",
      "Last updated: June 27, 2026.",
    ],
  },
  {
    title: "Information we collect",
    paragraphs: ["We may collect the following categories of information:"],
    list: [
      "Contact details you submit through our inquiry form (name, email, phone, company, project details).",
      "Communications you send to us by email or other channels.",
      "Billing and transaction data processed through Stripe when you pay an invoice or use a payment link.",
      "Basic technical data such as browser type, device information, and pages visited, collected through standard server logs and cookies required for site operation.",
    ],
  },
  {
    title: "How we use information",
    paragraphs: [
      "We use collected information to respond to inquiries, deliver services, issue and collect invoices, improve our website, comply with legal obligations, and communicate with clients and prospects about projects they have requested.",
      "We do not sell personal information.",
    ],
  },
  {
    title: "Service providers",
    paragraphs: [
      "We use trusted third-party providers to operate the site and business, including hosting (Vercel), email delivery (Resend), and payments (Stripe). These providers process data on our behalf under their own privacy terms and applicable agreements.",
    ],
  },
  {
    title: "Retention & security",
    paragraphs: [
      "We retain information only as long as needed for the purposes described above, unless a longer period is required by law. We apply reasonable administrative and technical safeguards, but no method of transmission or storage is completely secure.",
    ],
  },
  {
    title: "Your choices",
    paragraphs: [
      `You may request access, correction, or deletion of personal information we hold by contacting ${CONTACT_EMAIL}. You may opt out of non-essential marketing messages at any time.`,
    ],
  },
  {
    title: "Contact",
    paragraphs: [
      `Questions about this policy may be sent to ${CONTACT_EMAIL}.`,
      "8th & Exchange Media, LLC · Augusta, Georgia",
    ],
  },
];

export const metadata = pageMetadata({
  title: "Privacy Policy",
  description: "Privacy Policy for 8th & Exchange Media — how we collect, use, and protect your information.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <PageShell>
      <PageHero
        index="Legal"
        label="Privacy"
        title={
          <>
            Your privacy, handled with{" "}
            <span className="text-navy">care</span>.
          </>
        }
        description="How 8th & Exchange Media collects, uses, and protects information across our website and client services."
      />
      <section className="pb-20 md:pb-28">
        <div className="container-content max-w-3xl">
          <LegalProse sections={SECTIONS} />
        </div>
      </section>
    </PageShell>
  );
}
