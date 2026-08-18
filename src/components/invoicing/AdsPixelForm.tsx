"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdsPixelForm({
  clientId,
  brandLabel,
  defaultName,
}: {
  clientId: string | null;
  brandLabel: string;
  defaultName: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(defaultName);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function createPixel() {
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/invoicing/ads/pixels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), clientId }),
      });
      const data = (await response.json().catch(() => null)) as {
        error?: string;
        nextStep?: string;
        pixel?: { id?: string };
      } | null;
      if (!response.ok) {
        setError(data?.error ?? "Failed to create the Pixel");
        return;
      }
      setMessage(data?.nextStep ?? `Created Pixel ${data?.pixel?.id ?? ""} for ${brandLabel}.`);
      router.refresh();
    } catch {
      setError("Failed to create the Pixel — try again");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {message ? <div className="inv-alert inv-alert-success">{message}</div> : null}
      {error ? <div className="inv-alert inv-alert-error">{error}</div> : null}
      <div className="inv-field">
        <label className="inv-label" htmlFor="pixel-name">
          New Pixel name
        </label>
        <input
          id="pixel-name"
          className="inv-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="off"
        />
      </div>
      <button
        type="button"
        className="inv-btn inv-btn-primary"
        disabled={busy || !name.trim()}
        onClick={() => void createPixel()}
      >
        {busy ? "Creating…" : `Create Pixel for ${brandLabel}`}
      </button>
    </div>
  );
}
