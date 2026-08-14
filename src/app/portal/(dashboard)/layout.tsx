import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getPortalClientId } from "@/lib/portal/auth";
import { getClientById } from "@/lib/portal/service";

export default async function PortalDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const clientId = await getPortalClientId();
  const client = clientId ? await getClientById(clientId) : null;

  if (!client || !client.active) {
    redirect("/portal/login");
  }

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <header className="border-b border-navy/10 bg-paper">
        <div className="container-content flex h-16 items-center justify-between gap-4">
          <Link href="/portal" className="flex min-w-0 items-center gap-3">
            <Image
              src="/brand/assets/logo/coin-primary-antiqued.png"
              alt="8th & Exchange Media"
              width={34}
              height={34}
            />
            <span className="flex min-w-0 flex-col leading-tight">
              <span className="truncate text-sm font-semibold text-navy">{client.company}</span>
              <span className="eyebrow text-[0.5625rem] text-ink/45">Client Portal</span>
            </span>
          </Link>

          <nav className="flex items-center gap-5" aria-label="Portal">
            <Link href="/portal" className="nav-link">
              Requests
            </Link>
            <Link href="/portal/brand" className="nav-link">
              Brand Kit
            </Link>
            <form action="/api/portal/auth" method="POST">
              <input type="hidden" name="action" value="logout" />
              <button type="submit" className="nav-link">
                Sign out
              </button>
            </form>
          </nav>
        </div>
      </header>

      <main className="container-content flex-1 py-10 md:py-14">{children}</main>

      <footer className="border-t border-navy/10 bg-paper py-6">
        <div className="container-content flex flex-wrap items-center justify-between gap-3 text-xs text-ink/50">
          <span>8th &amp; Exchange Media · Augusta, Georgia</span>
          <span>
            Need something outside the queue?{" "}
            <a href="mailto:media@8thandexchange.com" className="text-navy underline underline-offset-4">
              media@8thandexchange.com
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
