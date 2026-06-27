import Link from "next/link";
import { SpotIllustration } from "@/components/editorial/IllustrationFrame";
import { Button } from "@/components/ui/Button";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { ILLUSTRATIONS } from "@/lib/illustrations";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="flex min-h-[70vh] flex-col items-center justify-center bg-cream px-6 py-32 text-center">
        <SpotIllustration
          src={ILLUSTRATIONS.spots.notFound}
          alt="Hand-drawn paper airplane landed in a coffee cup"
          size={160}
          className="mx-auto mb-10"
        />
        <p className="eyebrow eyebrow-on-light mb-4">404</p>
        <h1 className="type-h2 max-w-md">This page wandered off the page.</h1>
        <p className="type-body mx-auto mt-4 max-w-sm text-ink/65">
          The address may have moved, or the link may be out of date. Let&apos;s get you back
          on track.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Button href="/" tone="light" pill>
            Return home
          </Button>
          <Link href="/contact" className="editorial-link self-center">
            Contact us
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
