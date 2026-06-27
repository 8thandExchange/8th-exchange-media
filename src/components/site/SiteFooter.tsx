import Link from "next/link";
import { LogoLink } from "@/components/brand/Logo";
import { Logo } from "@/components/brand/Logo";
import { CONTACT_EMAIL } from "@/lib/site";
import { HairlineReveal } from "@/components/editorial/HairlineReveal";

const FOOTER_NAV = [
  { href: "/work", label: "Work" },
  { href: "/services", label: "Services" },
  { href: "/about", label: "Studio" },
  { href: "/contact", label: "Contact" },
];

const FAMILY = [
  { href: "https://8thandexchangecapital.com", label: "8th & Exchange Capital" },
  { href: "https://www.8thstreetconstruction.com", label: "8th Street Construction" },
  { href: "#", label: "Exchange House Hospitality" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-navy/10 bg-paper py-16 md:py-20">
      <div className="container-content">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr_1fr_0.8fr]">
          <div>
            <LogoLink variant="horizontal" />
            <p className="type-body mt-6 max-w-sm text-ink/70">
              Full-service media for brands that value craft, clarity, and steady performance. A
              division of{" "}
              <a
                href="https://8thandexchangecapital.com"
                className="editorial-link normal-case tracking-normal"
                target="_blank"
                rel="noopener noreferrer"
              >
                8th & Exchange Capital
              </a>
              .
            </p>
          </div>

          <div>
            <p className="eyebrow eyebrow-on-light mb-4">Navigate</p>
            <ul className="space-y-2">
              {FOOTER_NAV.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="nav-link normal-case">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="eyebrow eyebrow-on-light mb-4">The Family</p>
            <ul className="space-y-2">
              {FAMILY.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    target={item.href.startsWith("http") ? "_blank" : undefined}
                    rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                    className="nav-link normal-case"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col items-start gap-6">
            <div>
              <p className="eyebrow eyebrow-on-light mb-3">Connect</p>
              <a href={`mailto:${CONTACT_EMAIL}`} className="font-display text-lg italic text-navy">
                {CONTACT_EMAIL}
              </a>
              <p className="mt-3 text-sm text-ink/55">Augusta, Georgia</p>
            </div>
            <Logo variant="coin" className="h-16 w-16 opacity-90" />
          </div>
        </div>

        <HairlineReveal className="my-10" />
        <p className="text-xs text-ink/45">
          © {new Date().getFullYear()} 8th & Exchange Media, LLC. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
