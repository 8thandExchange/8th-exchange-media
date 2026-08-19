import { redirect } from "next/navigation";
import { getPortalClientId } from "@/lib/portal/auth";
import { getBrandKit, getClientById } from "@/lib/portal/service";

const SOCIAL_LABELS: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  x: "X (Twitter)",
  tiktok: "TikTok",
  youtube: "YouTube",
  google: "Google Business",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="inv-card">
      <div className="inv-detail-section">
        <div className="inv-detail-label">{title}</div>
        {children}
      </div>
    </div>
  );
}

export default async function PortalBrandPage() {
  const clientId = await getPortalClientId();
  if (!clientId) redirect("/portal/login");

  const [client, kit] = await Promise.all([getClientById(clientId), getBrandKit(clientId)]);
  if (!client) redirect("/portal/login");

  const empty =
    !kit ||
    (!kit.tagline &&
      !kit.mission &&
      !kit.voiceTone &&
      !(kit.colors?.length || kit.logos?.length || kit.assets?.length));

  return (
    <div style={{ maxWidth: 760 }}>
      <div className="inv-page-header">
        <div>
          <h1 className="inv-page-title">Brand kit</h1>
          <p className="inv-page-subtitle">
            {kit?.tagline ? `“${kit.tagline}”` : `The brand system behind everything we make for ${client.company}.`}
          </p>
        </div>
      </div>

      {empty ? (
        <div className="inv-card">
          <div className="inv-empty">
            <p className="inv-empty-title">Your brand kit is in progress.</p>
            <p className="inv-empty-text">
              We&apos;re assembling your brand system — voice, colors, typography, and assets. It
              will appear here as soon as it&apos;s ready, and every piece of work we produce will
              follow it.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {kit?.mission || kit?.audience ? (
            <Section title="Positioning">
              {kit.mission ? (
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{kit.mission}</p>
              ) : null}
              {kit.audience ? (
                <p className="mt-3 text-sm" style={{ color: "var(--inv-text-secondary)" }}>
                  <span className="font-medium" style={{ color: "var(--inv-text)" }}>
                    Audience:
                  </span>{" "}
                  {kit.audience}
                </p>
              ) : null}
            </Section>
          ) : null}

          {kit?.voiceTone || kit?.voiceDos?.length || kit?.voiceDonts?.length ? (
            <Section title="Voice">
              {kit.voiceTone ? (
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{kit.voiceTone}</p>
              ) : null}
              {kit.voiceDos?.length || kit.voiceDonts?.length ? (
                <div className="mt-4 grid gap-6 sm:grid-cols-2">
                  {kit.voiceDos?.length ? (
                    <div>
                      <p className="mb-2 text-xs font-medium" style={{ color: "var(--inv-success)" }}>
                        Always
                      </p>
                      <ul className="space-y-1 text-sm" style={{ color: "var(--inv-text-secondary)" }}>
                        {kit.voiceDos.map((d) => (
                          <li key={d}>· {d}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {kit.voiceDonts?.length ? (
                    <div>
                      <p className="mb-2 text-xs font-medium" style={{ color: "var(--inv-danger)" }}>
                        Never
                      </p>
                      <ul className="space-y-1 text-sm" style={{ color: "var(--inv-text-secondary)" }}>
                        {kit.voiceDonts.map((d) => (
                          <li key={d}>· {d}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </Section>
          ) : null}

          {kit?.colors?.length ? (
            <Section title="Colors">
              <div className="grid gap-4 sm:grid-cols-2">
                {kit.colors.map((c) => (
                  <div key={c.hex + c.name} className="flex items-center gap-4">
                    <span
                      aria-hidden
                      className="h-12 w-12 flex-shrink-0 rounded-md border"
                      style={{ backgroundColor: c.hex, borderColor: "var(--inv-border)" }}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{c.name}</p>
                      <p className="text-xs" style={{ color: "var(--inv-text-muted)" }}>
                        {c.hex}
                        {c.usage ? ` · ${c.usage}` : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          ) : null}

          {kit?.headingFont || kit?.bodyFont || kit?.typographyNotes ? (
            <Section title="Typography">
              <div className="space-y-2 text-sm">
                {kit.headingFont ? (
                  <p>
                    <span className="font-medium">Headings:</span> {kit.headingFont}
                  </p>
                ) : null}
                {kit.bodyFont ? (
                  <p>
                    <span className="font-medium">Body:</span> {kit.bodyFont}
                  </p>
                ) : null}
                {kit.typographyNotes ? (
                  <p className="whitespace-pre-wrap" style={{ color: "var(--inv-text-secondary)" }}>
                    {kit.typographyNotes}
                  </p>
                ) : null}
              </div>
            </Section>
          ) : null}

          {kit?.logos?.length || kit?.assets?.length ? (
            <Section title="Logos & assets">
              <ul className="space-y-2">
                {[...(kit.logos ?? []), ...(kit.assets ?? [])].map((l) => (
                  <li key={l.url + l.label}>
                    <a
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inv-link text-sm"
                    >
                      {l.label} ↗
                    </a>
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}

          {kit?.socials && Object.keys(kit.socials).length ? (
            <Section title="Social accounts">
              <ul className="space-y-1 text-sm" style={{ color: "var(--inv-text-secondary)" }}>
                {Object.entries(kit.socials).map(([key, value]) => (
                  <li key={key}>
                    <span className="font-medium" style={{ color: "var(--inv-text)" }}>
                      {SOCIAL_LABELS[key] ?? key}:
                    </span>{" "}
                    {value}
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}
        </div>
      )}
    </div>
  );
}
