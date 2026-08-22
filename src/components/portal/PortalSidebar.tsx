"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Client-portal rail — the client-side mirror of InvoicingSidebar, on the
 * same inv-* system. Social sits beside Work and Billing, not under them:
 * this is the client's window into the same pipeline staff run.
 */
const NAV_GROUPS: { section: string; items: { href: string; label: string; exact?: boolean }[] }[] = [
  {
    section: "Portal",
    items: [
      { href: "/portal", label: "Overview", exact: true },
      { href: "/portal/growth", label: "Growth & performance" },
    ],
  },
  {
    section: "Social",
    items: [
      { href: "/portal/approvals", label: "Approvals" },
      { href: "/portal/social", label: "Content" },
    ],
  },
  {
    section: "Work",
    items: [
      { href: "/portal/requests", label: "Requests" },
      { href: "/portal/brand", label: "Brand Kit" },
    ],
  },
  {
    section: "Billing",
    items: [{ href: "/portal/billing", label: "Invoices" }],
  },
];

function sectionLabelFor(pathname: string): string {
  for (const group of NAV_GROUPS) {
    for (const item of group.items) {
      const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
      if (active) return `${group.section} · ${item.label}`;
    }
  }
  return "Portal";
}

export function PortalSidebar({ company }: { company: string }) {
  const pathname = usePathname();

  return (
    <aside className="inv-sidebar">
      <div className="inv-sidebar-brand">
        <Image
          src="/brand/assets/logo/coin-primary-antiqued.svg"
          alt="8th & Exchange Media"
          width={36}
          height={36}
          className="inv-sidebar-brand-mark"
        />
        <div className="min-w-0">
          <div className="inv-sidebar-brand-title truncate">{company}</div>
          <div className="inv-sidebar-brand-sub">Client Portal</div>
        </div>
      </div>
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
      <div className="border-t border-[#e4e4e7] p-4">
        <form action="/api/portal/auth" method="POST">
          <input type="hidden" name="action" value="logout" />
          <button
            type="submit"
            className="w-full text-left text-[13px] text-[#71717a] transition-colors hover:text-[#18181b]"
          >
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}

export function PortalTopbar() {
  const pathname = usePathname();
  return (
    <div className="inv-topbar">
      <div className="inv-topbar-crumb">{sectionLabelFor(pathname)}</div>
      <a href="mailto:media@8thandexchange.com" className="inv-topbar-link">
        media@8thandexchange.com
      </a>
    </div>
  );
}
