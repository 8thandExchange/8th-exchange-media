import { PageShell } from "@/components/site/PageShell";
import { PageHero } from "@/components/site/PageHero";
import { LegalProse } from "@/components/legal/LegalProse";
import { CONTACT_EMAIL } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";

const SECTIONS = [
  {
    title: "Agreement",
    paragraphs: [
      "These Terms of Service (\"Terms\") govern your use of 8emedia.com and related online services operated by 8th & Exchange Media, LLC (\"8E Media,\" \"we,\" \"us\"). By accessing the site, you agree to these Terms.",
      "Last updated: June 27, 2026.",
    ],
  },
  {
    title: "Services",
    paragraphs: [
      "8E Media provides media, marketing, creative, and related professional services under separate statements of work, proposals, or client agreements. Website content is for general information and does not constitute a binding offer unless confirmed in writing.",
    ],
  },
  {
    title: "Acceptable use",
    paragraphs: ["You agree not to:"],
    list: [
      "Use the site in any unlawful manner or to transmit harmful, fraudulent, or unauthorized content.",
      "Attempt to gain unauthorized access to systems, accounts, or data, including staff invoicing tools.",
      "Interfere with site security, performance, or other users' access.",
    ],
  },
  {
    title: "Intellectual property",
    paragraphs: [
      "Site content — including text, design, logos, illustrations, and code — is owned by 8E Media or its licensors and protected by applicable intellectual property laws. Client deliverables are governed by the applicable project agreement.",
    ],
  },
  {
    title: "Payments",
    paragraphs: [
      "Invoices and payment links may be processed through Stripe. By submitting payment, you also agree to Stripe's applicable terms. Amounts, scope, and refunds are defined in the relevant invoice or client agreement.",
    ],
  },
  {
    title: "Disclaimer",
    paragraphs: [
      "The site is provided \"as is\" without warranties of any kind, express or implied, to the fullest extent permitted by law. We do not guarantee uninterrupted or error-free operation.",
    ],
  },
  {
    title: "Limitation of liability",
    paragraphs: [
      "To the fullest extent permitted by law, 8E Media shall not be liable for indirect, incidental, special, consequential, or punitive damages arising from use of the site. Our total liability for claims relating to the site shall not exceed one hundred U.S. dollars (USD $100) unless otherwise required by law.",
    ],
  },
  {
    title: "Governing law",
    paragraphs: [
      "These Terms are governed by the laws of the State of Georgia, without regard to conflict-of-law principles. Disputes shall be brought in courts located in Richmond County, Georgia, unless otherwise agreed in writing.",
    ],
  },
  {
    title: "Contact",
    paragraphs: [
      `Questions about these Terms may be sent to ${CONTACT_EMAIL}.`,
      "8th & Exchange Media, LLC · Augusta, Georgia",
    ],
  },
];

export const metadata = pageMetadata({
  title: "Terms of Service",
  description: "Terms of Service for 8th & Exchange Media website and online tools.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <PageShell>
      <PageHero
        index="Legal"
        label="Terms"
        title={
          <>
            Clear terms for using{" "}
            <span className="text-navy">our site</span>.
          </>
        }
        description="Terms governing access to 8emedia.com, client communications, and online payment tools."
      />
      <section className="pb-20 md:pb-28">
        <div className="container-content max-w-3xl">
          <LegalProse sections={SECTIONS} />
        </div>
      </section>
    </PageShell>
  );
}
