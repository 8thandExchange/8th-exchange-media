import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

interface PageShellProps {
  children: React.ReactNode;
}

export function PageShell({ children }: PageShellProps) {
  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-cream pt-[4.75rem] md:pt-20">{children}</main>
      <SiteFooter />
    </>
  );
}
