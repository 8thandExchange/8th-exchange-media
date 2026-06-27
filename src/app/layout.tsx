import type { Metadata } from "next";
import { Playfair_Display, Hanken_Grotesk } from "next/font/google";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "8th & Exchange Media | Full-Service Media Company",
    template: "%s | 8th & Exchange Media",
  },
  description:
    "8th & Exchange Media is a full-service media company delivering brand strategy, creative production, digital marketing, and performance media. A division of 8th & Exchange Capital.",
  icons: {
    icon: [
      { url: "/brand/assets/favicon/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/brand/assets/favicon/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/brand/assets/favicon/apple-touch-icon-180.png",
  },
  openGraph: {
    title: "8th & Exchange Media | Full-Service Media Company",
    description:
      "Strategy, creative, production, and performance — a media studio built on restraint and flawless execution.",
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    images: [{ url: "/brand/illustrations/features/img-hero.png", width: 1200, height: 800 }],
  },
  alternates: {
    canonical: SITE_URL,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${playfair.variable} ${hanken.variable} h-full`}>
      <body className="min-h-full page-enter">
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
