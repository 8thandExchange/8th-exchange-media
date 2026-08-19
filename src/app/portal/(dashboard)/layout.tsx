import { Inter } from "next/font/google";
import { redirect } from "next/navigation";
import { PortalSidebar, PortalTopbar } from "@/components/portal/PortalSidebar";
import { getPortalClientId } from "@/lib/portal/auth";
import { getClientById } from "@/lib/portal/service";
import "../../invoicing/invoicing.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

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
    <div className={`inv-shell ${inter.variable}`}>
      <div className="inv-layout flex min-h-screen">
        <PortalSidebar company={client.company} />
        <div className="inv-main">
          <PortalTopbar />
          <main className="inv-content">{children}</main>
        </div>
      </div>
    </div>
  );
}
