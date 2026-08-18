import { CookieConsent } from "@/components/site/CookieConsent";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

interface PageShellProps {
  children: React.ReactNode;
}

/** Public marketing chrome only — Pixel / GA never load on /invoicing, /portal, or /pay. */
export function PageShell({ children }: PageShellProps) {
  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-cream pt-[4.75rem] md:pt-20">{children}</main>
      <SiteFooter />
      <CookieConsent />
    </>
  );
}
