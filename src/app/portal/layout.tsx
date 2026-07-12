import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Client Portal",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function PortalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="min-h-screen bg-cream">{children}</div>;
}
