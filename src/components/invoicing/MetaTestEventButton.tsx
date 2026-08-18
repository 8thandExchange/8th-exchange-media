"use client";

import { useState } from "react";

export function MetaTestEventButton({
  clientId,
  disabled,
}: {
  clientId?: string | null;
  disabled?: boolean;
}) {
  const [testEventCode, setTestEventCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function send() {
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/invoicing/ads/meta/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: clientId || undefined,
          testEventCode: testEventCode.trim() || undefined,
        }),
      });
      const data = (await response.json().catch(() => null)) as {
        error?: string;
        eventId?: string;
        eventsReceived?: number;
      } | null;
      if (!response.ok) {
        setError(data?.error ?? "Test event failed");
        return;
      }
      setMessage(
        `Events Manager received ${data?.eventsReceived ?? 0} event${
          data?.eventsReceived === 1 ? "" : "s"
        } (id ${data?.eventId ?? "—"}). Open the Dataset → Test events within two minutes.`
      );
    } catch {
      setError("Test event failed — try again");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="inv-field">
        <label className="inv-label" htmlFor="meta-test-code">
          Test event code (optional — from Events Manager → Test events)
        </label>
        <input
          id="meta-test-code"
          className="inv-input"
          placeholder="TEST12345"
          value={testEventCode}
          onChange={(e) => setTestEventCode(e.target.value)}
          autoComplete="off"
        />
      </div>
      {message ? <div className="inv-alert inv-alert-success">{message}</div> : null}
      {error ? <div className="inv-alert inv-alert-error">{error}</div> : null}
      <button
        type="button"
        className="inv-btn inv-btn-secondary"
        disabled={busy || disabled}
        onClick={() => void send()}
      >
        {busy ? "Sending…" : "Send a test Lead"}
      </button>
    </div>
  );
}
