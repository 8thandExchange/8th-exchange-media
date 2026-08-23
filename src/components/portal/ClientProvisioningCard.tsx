"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { CLIENT_TYPES, type ClientType } from "@/lib/portal/checklist";
import {
  BAA_STATUSES,
  ENTITY_TYPES,
  type BaaStatus,
  type EntityType,
  type PortalClient,
} from "@/lib/portal/types";

/**
 * The one card that holds everything a GHL sub-account setup asks for:
 * business identity, contact info, address, socials — editable in place,
 * plus a copy-ready block for pasting into GHL, plus the payment method
 * (a Stripe-hosted setup link; card data never touches our database).
 */
export function ClientProvisioningCard({
  client,
  cardOnFile,
}: {
  client: PortalClient;
  cardOnFile: boolean | null; // null = Stripe unreachable / not configured
}) {
  const router = useRouter();
  const [company, setCompany] = useState(client.company);
  const [contactName, setContactName] = useState(client.contact_name);
  const [phone, setPhone] = useState(client.phone ?? "");
  const [website, setWebsite] = useState(client.website ?? "");
  const [address, setAddress] = useState(client.address ?? "");
  const [socials, setSocials] = useState(
    Object.entries(client.socials ?? {})
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n")
  );
  const [clientType, setClientType] = useState<ClientType>(client.client_type ?? "local");
  const [legalName, setLegalName] = useState(client.legal_name ?? "");
  const [ein, setEin] = useState(client.ein ?? "");
  const [entityType, setEntityType] = useState<EntityType | "">(client.entity_type ?? "");
  const [registeredAgent, setRegisteredAgent] = useState(client.registered_agent ?? "");
  const [baaStatus, setBaaStatus] = useState<BaaStatus | "">(client.baa_status ?? "");
  const [phiPermitted, setPhiPermitted] = useState<"" | "true" | "false">(
    client.phi_permitted === null || client.phi_permitted === undefined
      ? ""
      : client.phi_permitted
        ? "true"
        : "false"
  );
  const [subprocessors, setSubprocessors] = useState((client.subprocessors ?? []).join("\n"));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [setupLink, setSetupLink] = useState("");

  const ghlBlock = useMemo(
    () =>
      [
        `Business name: ${company}`,
        `Contact: ${contactName}`,
        `Email: ${client.email}`,
        phone ? `Phone: ${phone}` : null,
        website ? `Website: ${website}` : null,
        address ? `Address: ${address}` : null,
        socials.trim() ? `Socials:\n${socials.trim()}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
    [company, contactName, client.email, phone, website, address, socials]
  );

  function parseSocials(raw: string): Record<string, string> {
    const out: Record<string, string> = {};
    for (const line of raw.split("\n")) {
      const idx = line.indexOf(":");
      if (idx > 0) {
        const key = line.slice(0, idx).trim();
        const val = line.slice(idx + 1).trim();
        if (key && val) out[key] = val;
      }
    }
    return out;
  }

  async function save() {
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch(`/api/portal/admin/clients/${client.id}/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company,
          contactName,
          phone: phone.trim() || null,
          website: website.trim() || null,
          address: address.trim() || null,
          socials: parseSocials(socials),
          clientType,
          legalName: legalName.trim() || null,
          ein: ein.trim() || null,
          entityType: entityType || null,
          registeredAgent: registeredAgent.trim() || null,
          baaStatus: baaStatus || null,
          phiPermitted: phiPermitted === "" ? null : phiPermitted === "true",
          subprocessors: subprocessors
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean),
        }),
      });
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setError(data?.error ?? "Failed to save");
        return;
      }
      setMessage("Profile saved.");
      router.refresh();
    } catch {
      setError("Failed to save — try again");
    } finally {
      setBusy(false);
    }
  }

  async function copyGhlBlock() {
    await navigator.clipboard.writeText(ghlBlock);
    setMessage("Copied — paste straight into the GHL sub-account setup.");
  }

  async function createSetupLink() {
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch(`/api/portal/admin/clients/${client.id}/payment-setup`, {
        method: "POST",
      });
      const data = (await response.json().catch(() => null)) as {
        url?: string;
        error?: string;
      } | null;
      if (!response.ok || !data?.url) {
        setError(data?.error ?? "Failed to create the setup link");
        return;
      }
      setSetupLink(data.url);
      await navigator.clipboard.writeText(data.url);
      setMessage("Card-setup link created and copied — send it to the client.");
      router.refresh();
    } catch {
      setError("Failed to create the setup link — try again");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="inv-card">
      <div className="inv-detail-label">Onboarding & GHL provisioning</div>

      {message ? <div className="inv-alert inv-alert-success">{message}</div> : null}
      {error ? <div className="inv-alert inv-alert-error">{error}</div> : null}

      <div className="inv-form-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
        <div className="inv-field">
          <label className="inv-label" htmlFor="pv-company">Business name</label>
          <input id="pv-company" className="inv-input" value={company} onChange={(e) => setCompany(e.target.value)} />
        </div>
        <div className="inv-field">
          <label className="inv-label" htmlFor="pv-contact">Contact name</label>
          <input id="pv-contact" className="inv-input" value={contactName} onChange={(e) => setContactName(e.target.value)} />
        </div>
        <div className="inv-field">
          <label className="inv-label" htmlFor="pv-phone">Phone</label>
          <input id="pv-phone" className="inv-input" placeholder="(706) …" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div className="inv-field">
          <label className="inv-label" htmlFor="pv-website">Website</label>
          <input id="pv-website" className="inv-input" placeholder="https://…" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </div>
        <div className="inv-field" style={{ gridColumn: "1 / -1" }}>
          <label className="inv-label" htmlFor="pv-address">Business address</label>
          <input id="pv-address" className="inv-input" placeholder="Street, city, state, zip" value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>
        <div className="inv-field" style={{ gridColumn: "1 / -1" }}>
          <label className="inv-label" htmlFor="pv-socials">Socials (one per line, e.g. instagram: @handle)</label>
          <textarea id="pv-socials" className="inv-textarea" rows={3} value={socials} onChange={(e) => setSocials(e.target.value)} />
        </div>
      </div>

      <div style={{ borderTop: "1px solid var(--inv-border)", marginTop: "20px", paddingTop: "18px" }}>
        <div className="inv-detail-label">Client type</div>
        <p style={{ fontSize: "13px", color: "var(--inv-text-secondary)", marginBottom: "12px", maxWidth: "62ch" }}>
          Changes which checklist items render and which are required. Platform brands should not treat Google Business Profile as a ranking asset.
        </p>
        <div style={{ display: "grid", gap: "8px" }}>
          {CLIENT_TYPES.map((opt) => (
            <label key={opt.value} style={{ display: "grid", gridTemplateColumns: "18px 1fr", gap: 10, alignItems: "start" }}>
              <input
                type="radio"
                name="pv-client-type"
                checked={clientType === opt.value}
                onChange={() => setClientType(opt.value)}
                style={{ marginTop: 3, accentColor: "var(--inv-accent)" }}
              />
              <span>
                <span style={{ fontWeight: 600, fontSize: 13.5 }}>{opt.label}</span>
                <span style={{ display: "block", fontSize: 12, color: "var(--inv-text-muted)" }}>{opt.help}</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      <div style={{ borderTop: "1px solid var(--inv-border)", marginTop: "20px", paddingTop: "18px" }}>
        <div className="inv-detail-label">Legal entity</div>
        <p style={{ fontSize: "13px", color: "var(--inv-text-secondary)", marginBottom: "12px", maxWidth: "62ch" }}>
          A2P 10DLC registration will demand all four. Missing this is the item most likely to stall a launch by three weeks.
        </p>
        <div className="inv-form-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
          <div className="inv-field">
            <label className="inv-label" htmlFor="pv-legal">Legal name</label>
            <input id="pv-legal" className="inv-input" value={legalName} onChange={(e) => setLegalName(e.target.value)} />
          </div>
          <div className="inv-field">
            <label className="inv-label" htmlFor="pv-ein">EIN</label>
            <input id="pv-ein" className="inv-input" placeholder="XX-XXXXXXX" value={ein} onChange={(e) => setEin(e.target.value)} autoComplete="off" />
          </div>
          <div className="inv-field">
            <label className="inv-label" htmlFor="pv-entity">Entity type</label>
            <select
              id="pv-entity"
              className="inv-input"
              value={entityType}
              onChange={(e) => setEntityType(e.target.value as EntityType | "")}
            >
              <option value="">Select…</option>
              {ENTITY_TYPES.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="inv-field">
            <label className="inv-label" htmlFor="pv-agent">Registered agent</label>
            <input id="pv-agent" className="inv-input" value={registeredAgent} onChange={(e) => setRegisteredAgent(e.target.value)} />
          </div>
        </div>
      </div>

      <div style={{ borderTop: "1px solid var(--inv-border)", marginTop: "20px", paddingTop: "18px" }}>
        <div className="inv-detail-label">Compliance</div>
        <p style={{ fontSize: "13px", color: "var(--inv-text-secondary)", marginBottom: "12px", maxWidth: "62ch" }}>
          Hard gate. Healthcare and financial clients cannot move the digital-presence checklist until BAA status, PHI-in-CRM, and the subprocessor list are answered.
        </p>
        <div className="inv-form-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
          <div className="inv-field">
            <label className="inv-label" htmlFor="pv-baa">BAA status</label>
            <select
              id="pv-baa"
              className="inv-input"
              value={baaStatus}
              onChange={(e) => setBaaStatus(e.target.value as BaaStatus | "")}
            >
              <option value="">Unanswered — locks checklist</option>
              {BAA_STATUSES.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="inv-field">
            <label className="inv-label" htmlFor="pv-phi">PHI permitted in the CRM</label>
            <select
              id="pv-phi"
              className="inv-input"
              value={phiPermitted}
              onChange={(e) => setPhiPermitted(e.target.value as "" | "true" | "false")}
            >
              <option value="">Unanswered — locks checklist</option>
              <option value="false">No — keep PHI out of GHL</option>
              <option value="true">Yes — only after a BAA is executed</option>
            </select>
          </div>
          <div className="inv-field" style={{ gridColumn: "1 / -1" }}>
            <label className="inv-label" htmlFor="pv-sub">Subprocessor list (one per line)</label>
            <textarea
              id="pv-sub"
              className="inv-textarea"
              rows={3}
              placeholder="Go High Level / LeadConnector&#10;Stripe&#10;Resend"
              value={subprocessors}
              onChange={(e) => setSubprocessors(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="inv-action-row" style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "14px" }}>
        <button type="button" className="inv-btn inv-btn-primary" onClick={save} disabled={busy}>
          Save profile
        </button>
        <button type="button" className="inv-btn inv-btn-secondary" onClick={copyGhlBlock} disabled={busy}>
          Copy GHL setup block
        </button>
      </div>

      <div style={{ borderTop: "1px solid var(--inv-border)", marginTop: "20px", paddingTop: "18px" }}>
        <div className="inv-detail-label">Payment method</div>
        <p style={{ fontSize: "13px", color: "var(--inv-text-secondary)", marginBottom: "12px", maxWidth: "56ch" }}>
          {cardOnFile === null
            ? "Stripe status unavailable right now."
            : cardOnFile
              ? "✓ Card on file with Stripe. Charge via Invoices or Payment links as usual."
              : "No card on file yet. Create a Stripe-hosted setup link and send it to the client — the card goes straight to Stripe and never touches our systems."}
        </p>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
          <button type="button" className="inv-btn inv-btn-secondary" onClick={createSetupLink} disabled={busy}>
            {cardOnFile ? "New card-setup link" : "Create card-setup link"}
          </button>
          {setupLink ? (
            <code style={{ fontSize: "11.5px", wordBreak: "break-all", color: "var(--inv-text-secondary)" }}>{setupLink}</code>
          ) : null}
        </div>
      </div>
    </div>
  );
}
