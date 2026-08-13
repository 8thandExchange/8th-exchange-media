import Link from "next/link";
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
    <section className="border-hairline bg-paper p-6 md:p-8">
      <p className="eyebrow eyebrow-on-light mb-4">{title}</p>
      {children}
    </section>
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
    <div className="mx-auto max-w-3xl">
      <Link href="/portal" className="nav-link">
        ← Back to requests
      </Link>

      <div className="mb-8 mt-4">
        <p className="eyebrow eyebrow-on-light mb-2">Brand Kit</p>
        <h1 className="font-display text-3xl text-navy">{client.company}</h1>
        {kit?.tagline ? <p className="mt-2 text-lg italic text-ink/70">“{kit.tagline}”</p> : null}
      </div>

      {empty ? (
        <div className="border-hairline bg-paper p-10 text-center">
          <p className="font-display text-xl text-navy">Your brand kit is in progress.</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink/60">
            We&apos;re assembling your brand system — voice, colors, typography, and assets. It will
            appear here as soon as it&apos;s ready, and every piece of work we produce will follow
            it.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {kit?.mission || kit?.audience ? (
            <Section title="Positioning">
              {kit.mission ? (
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink/80">
                  {kit.mission}
                </p>
              ) : null}
              {kit.audience ? (
                <p className="mt-3 text-sm text-ink/60">
                  <span className="font-semibold text-navy">Audience:</span> {kit.audience}
                </p>
              ) : null}
            </Section>
          ) : null}

          {kit?.voiceTone || kit?.voiceDos?.length || kit?.voiceDonts?.length ? (
            <Section title="Voice">
              {kit.voiceTone ? (
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink/80">
                  {kit.voiceTone}
                </p>
              ) : null}
              {kit.voiceDos?.length || kit.voiceDonts?.length ? (
                <div className="mt-4 grid gap-6 sm:grid-cols-2">
                  {kit.voiceDos?.length ? (
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-gold-dark">
                        Always
                      </p>
                      <ul className="space-y-1 text-sm text-ink/75">
                        {kit.voiceDos.map((d) => (
                          <li key={d}>· {d}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {kit.voiceDonts?.length ? (
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-ink/45">
                        Never
                      </p>
                      <ul className="space-y-1 text-sm text-ink/75">
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
                      className="h-14 w-14 flex-shrink-0 border border-navy/15"
                      style={{ backgroundColor: c.hex }}
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-navy">{c.name}</p>
                      <p className="text-xs text-ink/55">
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
              <div className="space-y-2 text-sm text-ink/80">
                {kit.headingFont ? (
                  <p>
                    <span className="font-semibold text-navy">Headings:</span> {kit.headingFont}
                  </p>
                ) : null}
                {kit.bodyFont ? (
                  <p>
                    <span className="font-semibold text-navy">Body:</span> {kit.bodyFont}
                  </p>
                ) : null}
                {kit.typographyNotes ? (
                  <p className="whitespace-pre-wrap text-ink/60">{kit.typographyNotes}</p>
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
                      className="editorial-link normal-case tracking-normal"
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
              <ul className="space-y-1 text-sm text-ink/75">
                {Object.entries(kit.socials).map(([key, value]) => (
                  <li key={key}>
                    <span className="font-semibold text-navy">{SOCIAL_LABELS[key] ?? key}:</span>{" "}
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
