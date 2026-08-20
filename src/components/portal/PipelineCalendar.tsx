import Link from "next/link";
import type { SocialPostRow } from "@/lib/portal/social";

/**
 * Month calendar of the pipeline — the planning view every social tool
 * leads with. Server-rendered; navigation is querystring-only so it
 * composes with the brand picker.
 */
export function PipelineCalendar({
  posts,
  month,
  clientId,
}: {
  posts: SocialPostRow[];
  /** "YYYY-MM"; defaults handled by the page. */
  month: string;
  clientId: string | null;
}) {
  const [yearStr, monthStr] = month.split("-");
  const year = Number(yearStr);
  const monthIndex = Number(monthStr) - 1;
  const first = new Date(year, monthIndex, 1);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const leadingBlanks = first.getDay();

  const monthLabel = first.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const prev = new Date(year, monthIndex - 1, 1);
  const next = new Date(year, monthIndex + 1, 1);
  const toParam = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  const navHref = (d: Date) =>
    `/invoicing/social/pipeline?${clientId ? `client=${clientId}&` : ""}month=${toParam(d)}`;

  // A post lands on the calendar by its schedule date, or the day it
  // actually published when it was pushed immediately.
  const dated = posts
    .map((p) => ({ post: p, when: p.schedule_at ?? p.published_at }))
    .filter((x): x is { post: SocialPostRow; when: string } => Boolean(x.when))
    .map((x) => ({ ...x, date: new Date(x.when) }))
    .filter((x) => x.date.getFullYear() === year && x.date.getMonth() === monthIndex);

  const byDay = new Map<number, typeof dated>();
  for (const item of dated) {
    const day = item.date.getDate();
    byDay.set(day, [...(byDay.get(day) ?? []), item]);
  }

  const mix = new Map<string, number>();
  for (const { post } of dated) {
    const key = post.category ?? "uncategorized";
    mix.set(key, (mix.get(key) ?? 0) + 1);
  }

  const badgeClass = (status: SocialPostRow["status"]) =>
    status === "published"
      ? "inv-badge-paid"
      : status === "failed" || status === "rejected"
        ? "inv-badge-overdue"
        : "inv-badge-open";

  const today = new Date();
  const isThisMonth = today.getFullYear() === year && today.getMonth() === monthIndex;

  return (
    <div className="inv-card mt-6">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
        <div className="inv-detail-label" style={{ margin: 0 }}>
          Calendar — {monthLabel}
        </div>
        <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
          {[...mix.entries()].map(([category, count]) => (
            <span key={category} className="inv-badge inv-badge-open">
              {category} · {count}
            </span>
          ))}
          <Link href={navHref(prev)} className="inv-btn inv-btn-ghost" aria-label="Previous month">
            ←
          </Link>
          <Link href={navHref(next)} className="inv-btn inv-btn-ghost" aria-label="Next month">
            →
          </Link>
        </div>
      </div>

      <div style={{ overflowX: "auto", marginTop: "12px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(96px, 1fr))", gap: "4px", minWidth: "700px" }}>
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div
              key={d}
              style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--inv-text-muted)", padding: "2px 6px" }}
            >
              {d}
            </div>
          ))}
          {Array.from({ length: leadingBlanks }).map((_, i) => (
            <div key={`blank-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const items = byDay.get(day) ?? [];
            const isToday = isThisMonth && today.getDate() === day;
            return (
              <div
                key={day}
                style={{
                  border: "1px solid var(--inv-border)",
                  borderRadius: "6px",
                  minHeight: "76px",
                  padding: "4px 6px",
                  background: isToday ? "var(--inv-bg-subtle, rgba(0,0,0,0.03))" : undefined,
                }}
              >
                <div style={{ fontSize: "11.5px", fontWeight: isToday ? 700 : 500, color: "var(--inv-text-muted)" }}>
                  {day}
                </div>
                <div style={{ display: "grid", gap: "3px", marginTop: "3px" }}>
                  {items.slice(0, 3).map(({ post, date }) => (
                    <span
                      key={post.id}
                      className={`inv-badge ${badgeClass(post.status)}`}
                      title={post.summary.slice(0, 200)}
                      style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}
                    >
                      {date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}{" "}
                      {post.summary.slice(0, 24)}
                    </span>
                  ))}
                  {items.length > 3 ? (
                    <span style={{ fontSize: "10.5px", color: "var(--inv-text-muted)" }}>
                      +{items.length - 3} more
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
