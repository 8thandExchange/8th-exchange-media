import Image from "next/image";
import Link from "next/link";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Card Saved",
  description: "Your payment method is securely on file with 8th & Exchange Media.",
  path: "/pay/setup-complete",
});

export default function SetupCompletePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-5 py-16">
      <div className="w-full max-w-md border-hairline bg-paper p-10 text-center shadow-[0_24px_64px_-32px_rgba(11,27,61,0.3)]">
        <Image
          src="/brand/assets/logo/coin-primary-antiqued.png"
          alt="8th & Exchange Media"
          width={56}
          height={56}
          className="mx-auto mb-5"
        />
        <h1 className="font-display text-2xl text-navy">You&apos;re all set.</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink/65">
          Your payment method is securely on file with Stripe — we never see or store the card
          itself. Nothing is charged until work is invoiced and approved.
        </p>
        <Link href="/portal/login" className="editorial-link mt-8 inline-flex">
          Go to your client portal
        </Link>
      </div>
    </main>
  );
}
