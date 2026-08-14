import { InvoicingSidebar, InvoicingTopbar } from "@/components/invoicing/InvoicingSidebar";

export const dynamic = "force-dynamic";

export default function InvoicingDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
