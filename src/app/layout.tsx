import type { Metadata } from "next";
import { Fraunces, Hanken_Grotesk } from "next/font/google";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { CookieConsent } from "@/components/site/CookieConsent";
import { getAgencyPublicTrackers } from "@/lib/portal/metaStore";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["SOFT", "WONK", "opsz"],
});

const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const BASE_METADATA = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "8th & Exchange Media | Full-Funnel Marketing Agency",
    template: "%s | 8th & Exchange Media",
  },
  description:
    "8th & Exchange Media is a full-funnel marketing agency — email, SMS, social, ads, automation, audience management, creative production, and analytics, delivered by one team. A division of 8th & Exchange Capital.",
  icons: {
    icon: [
      { url: "/brand/assets/favicon/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/brand/assets/favicon/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/brand/assets/favicon/apple-touch-icon-180.png",
  },
  openGraph: {
    title: "8th & Exchange Media | Full-Funnel Marketing Agency",
    description:
      "Email, SMS, social, ads, and automation — one agency team that plans, produces, and optimizes your marketing on every channel.",
    type: "website" as const,
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    images: [{ url: "/brand/illustrations/features/img-hero.png", width: 1200, height: 800 }],
  },
  alternates: {
    canonical: SITE_URL,
  },
} satisfies Metadata;

async function publicTrackers() {
  try {
    return await getAgencyPublicTrackers();
  } catch {
    return { pixelId: "", domainVerification: "" };
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const { domainVerification } = await publicTrackers();
  return {
    ...BASE_METADATA,
    ...(domainVerification
      ? { other: { "facebook-domain-verification": domainVerification } }
      : {}),
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { pixelId } = await publicTrackers();
  return (
    <html lang="en" className={`${fraunces.variable} ${hanken.variable} h-full`}>
      <body className="min-h-full page-enter">
        <MotionProvider>{children}</MotionProvider>
        <CookieConsent pixelId={pixelId || null} ga4Id={process.env.NEXT_PUBLIC_GA4_ID || null} />
      </body>
    </html>
  );
}
