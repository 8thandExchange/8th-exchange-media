"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function PortalLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/portal/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, accessCode }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? "Invalid email or access code");
        return;
      }

      router.push("/portal");
      router.refresh();
    } catch {
      setError("Unable to sign in — please try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error ? (
        <p className="border border-navy/20 bg-navy/5 px-4 py-3 text-sm text-navy">{error}</p>
      ) : null}

      <div>
        <label htmlFor="portal-email" className="field-label field-label-on-light">
          Email
        </label>
        <input
          id="portal-email"
          type="email"
          autoComplete="email"
          required
          className="field-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="portal-code" className="field-label field-label-on-light">
          Access code
        </label>
        <input
          id="portal-code"
          type="password"
          autoComplete="current-password"
          required
          placeholder="XXXX-XXXX-XXXX"
          className="field-input"
          value={accessCode}
          onChange={(e) => setAccessCode(e.target.value)}
        />
        <p className="mt-2 text-xs text-ink/50">
          Your access code was provided by your account manager.
        </p>
      </div>

      <Button type="submit" tone="light" pill disabled={loading} className="w-full">
        {loading ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
