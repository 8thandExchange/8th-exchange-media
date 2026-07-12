import Image from "next/image";
import Link from "next/link";
import { PortalLoginForm } from "@/components/portal/PortalLoginForm";
import { CONTACT_EMAIL } from "@/lib/site";

export default function PortalLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-16">
      <div className="w-full max-w-md">
        <div className="border-hairline bg-paper p-8 shadow-[0_24px_64px_-32px_rgba(11,27,61,0.3)] md:p-10">
          <div className="mb-8 text-center">
            <Image
              src="/brand/assets/logo/coin-primary-antiqued.png"
              alt="8th & Exchange Media"
              width={56}
              height={56}
              className="mx-auto mb-5"
            />
            <h1 className="font-display text-2xl text-navy">Client Portal</h1>
            <p className="mt-2 text-sm text-ink/60">
              Submit requests, follow progress, and pick up deliverables.
            </p>
          </div>

          <PortalLoginForm />
        </div>

        <p className="mt-6 text-center text-xs text-ink/50">
          Need access?{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-navy underline underline-offset-4">
            {CONTACT_EMAIL}
          </a>{" "}
          ·{" "}
          <Link href="/" className="text-navy underline underline-offset-4">
            Back to site
          </Link>
        </p>
      </div>
    </main>
  );
}
