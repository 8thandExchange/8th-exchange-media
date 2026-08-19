"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Studio dashboard rail — grouped by what the work is, not by which
 * feature shipped first: the studio's day-to-day, the client roster,
 * then money.
 */
const NAV_GROUPS: { section: string; items: { href: string; label: string; exact?: boolean }[] }[] = [
  {
    section: "Studio",
    items: [
      { href: "/invoicing", label: "Overview", exact: true },
      { href: "/invoicing/social", label: "Social Planner", exact: true },
      { href: "/invoicing/social/pipeline", label: "Content Pipeline" },
    ],
  },
  {
    section: "Clients",
    items: [
      { href: "/invoicing/leads", label: "Leads" },
      { href: "/invoicing/clients", label: "Portal clients" },
      { href: "/invoicing/requests", label: "Requests" },
    ],
  },
  {
    section: "Billing",
    items: [
      { href: "/invoicing/invoices", label: "Invoices" },
      { href: "/invoicing/customers", label: "Customers" },
      { href: "/invoicing/payment-links", label: "Payment links" },
    ],
  },
];

/** Current section label for the topbar, from the same nav source. */
export function sectionLabelFor(pathname: string): string {
  for (const group of NAV_GROUPS) {
    for (const item of group.items) {
      const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
      if (active) return `${group.section} · ${item.label}`;
    }
  }
  return "Studio";
}

export function InvoicingSidebar() {
  const pathname = usePathname();

  return (
    <aside className="inv-sidebar">
      <Link href="/" className="inv-sidebar-brand" title="Back to 8emedia.com">
        <Image
          src="/brand/assets/logo/coin-reversed-gold-antiqued.svg"
          alt=""
          width={36}
          height={36}
          className="inv-sidebar-brand-mark"
        />
        <div>
          <div className="inv-sidebar-brand-title">8th &amp; Exchange</div>
          <div className="inv-sidebar-brand-sub">Studio Dashboard</div>
        </div>
      </Link>
      <nav className="inv-nav">
        {NAV_GROUPS.map((group) => (
          <div key={group.section}>
            <div className="inv-nav-section">{group.section}</div>
            {group.items.map((item) => {
              const active = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn("inv-nav-link", active && "active")}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="border-t border-[rgba(244,239,227,0.12)] p-4">
        <form action="/api/invoicing/auth" method="POST">
          <input type="hidden" name="action" value="logout" />
          <button
            type="submit"
            className="w-full text-left text-[13px] text-[rgba(244,239,227,0.6)] transition-colors hover:text-[#f4efe3]"
          >
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}

export function InvoicingTopbar() {
  const pathname = usePathname();
  return (
    <div className="inv-topbar">
      <div className="inv-topbar-crumb">{sectionLabelFor(pathname)}</div>
      <a href="https://8emedia.com" target="_blank" rel="noopener noreferrer" className="inv-topbar-link">
        8emedia.com ↗
      </a>
    </div>
  );
}
