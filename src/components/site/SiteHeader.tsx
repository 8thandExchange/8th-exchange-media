"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { HeaderLogo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/services", label: "Services" },
  { href: "/about", label: "Studio" },
  { href: "/contact", label: "Contact" },
];

function isNavActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 border-b border-cream/[0.12] bg-navy transition-[padding,height] duration-500",
          scrolled ? "h-16" : "h-[4.75rem] md:h-20"
        )}
      >
        <div
          className={cn(
            "container-content flex h-full items-center justify-between gap-6 transition-[padding] duration-500",
            scrolled ? "py-3" : "py-4 md:py-5"
          )}
        >
          <HeaderLogo priority />

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
            {NAV.map((item, i) => (
              <span key={item.href} className="flex items-center">
                {i > 0 ? (
                  <span className="mx-5 h-3.5 w-px bg-cream/[0.12]" aria-hidden />
                ) : null}
                <Link
                  href={item.href}
                  className="nav-link-on-dark px-1 py-2"
                  data-active={isNavActive(pathname, item.href) ? "true" : undefined}
                  aria-current={isNavActive(pathname, item.href) ? "page" : undefined}
                >
                  {item.label}
                </Link>
              </span>
            ))}
            <span className="mx-6 h-3.5 w-px bg-cream/[0.12]" aria-hidden />
            <Button href="/contact" tone="dark-gold" pill>
              Start a Project
            </Button>
          </nav>

          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="flex flex-col gap-1.5 p-2 text-cream lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            <span
              className={cn(
                "block h-px w-6 bg-current transition-transform duration-500",
                open && "translate-y-[7px] rotate-45"
              )}
            />
            <span
              className={cn(
                "block h-px w-6 bg-current transition-transform duration-500",
                open && "scale-x-0 opacity-0"
              )}
            />
            <span
              className={cn(
                "block h-px w-6 bg-current transition-transform duration-500",
                open && "-translate-y-[7px] -rotate-45"
              )}
            />
          </button>
        </div>
      </header>

      <div
        className={cn(
          "fixed inset-0 z-40 flex flex-col bg-navy pt-[4.75rem] transition-opacity duration-500 lg:hidden",
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        )}
        aria-hidden={!open}
      >
        <nav
          className="flex flex-1 flex-col items-center justify-center gap-7 px-6"
          aria-label="Mobile primary"
        >
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "font-display text-3xl italic transition-colors duration-300",
                isNavActive(pathname, item.href) ? "text-gold" : "text-cream hover:text-gold"
              )}
              aria-current={isNavActive(pathname, item.href) ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
          <Button href="/contact" tone="dark-gold" pill className="mt-2">
            Start a Project
          </Button>
        </nav>
      </div>
    </>
  );
}
