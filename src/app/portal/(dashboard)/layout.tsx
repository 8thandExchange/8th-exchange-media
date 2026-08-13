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
    <>
      <header className="border-b border-navy/10 bg-paper">
        <div className="container-content flex h-16 items-center justify-between gap-4">
          <Link href="/portal" className="flex items-center gap-3">
            <Image
              src="/brand/assets/logo/coin-primary-antiqued.png"
              alt="8th & Exchange Media"
              width={34}
              height={34}
            />
            <span className="hidden text-sm font-semibold text-navy sm:block">
              Client Portal
            </span>
          </Link>

          <div className="flex items-center gap-5">
            <Link href="/portal/brand" className="nav-link">
              Brand Kit
            </Link>
            <span className="hidden text-sm text-ink/60 sm:block">{client.company}</span>
            <form action="/api/portal/auth" method="POST">
              <input type="hidden" name="action" value="logout" />
              <button type="submit" className="nav-link">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="container-content py-10 md:py-14">{children}</main>
    </>
  );
}
