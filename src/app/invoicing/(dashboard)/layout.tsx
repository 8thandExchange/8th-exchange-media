import { InvoicingSidebar, InvoicingTopbar } from "@/components/invoicing/InvoicingSidebar";
import { redirect } from "next/navigation";
import { isInvoicingAuthenticated } from "@/lib/invoicing/auth";

export const dynamic = "force-dynamic";

export default async function InvoicingDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  if (!(await isInvoicingAuthenticated())) {
    redirect("/invoicing/login");
  }

  return (
    <div className="inv-layout flex min-h-screen">
      <InvoicingSidebar />
      <div className="inv-main">
        <InvoicingTopbar />
        <main className="inv-content">{children}</main>
      </div>
    </div>
  );
}
