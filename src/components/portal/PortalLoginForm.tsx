"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";

/**
 * Two-step sign-in: email → 6-digit emailed code. No passwords, nothing
 * for a client to store or lose. The code input is a single field styled
 * as six glyph slots; paste works; resend has a cooldown.
 */

const RESEND_COOLDOWN_S = 30;

export function PortalLoginForm() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  useEffect(() => {
    if (step === "code") codeRef.current?.focus();
  }, [step]);

  async function post(body: Record<string, string>) {
    const response = await fetch("/api/portal/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    return { ok: response.ok, error: data?.error };
  }

  async function requestCode(event?: React.FormEvent) {
    event?.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await post({ action: "request-code", email });
      if (!result.ok) {
        setError(result.error ?? "Something went wrong — try again");
        return;
      }
      setStep("code");
      setCode("");
      setCooldown(RESEND_COOLDOWN_S);
    } catch {
      setError("Something went wrong — try again");
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await post({ action: "verify-code", email, code });
      if (!result.ok) {
        setError(result.error ?? "That code didn't match");
        return;
      }
      router.push("/portal");
      router.refresh();
    } catch {
      setError("Something went wrong — try again");
    } finally {
      setLoading(false);
    }
  }

  if (step === "email") {
    return (
      <form onSubmit={requestCode} className="space-y-6">
        {error ? (
          <p className="border border-navy/20 bg-navy/5 px-4 py-3 text-sm text-navy" role="alert">
            {error}
          </p>
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
            autoFocus
            placeholder="you@yourbusiness.com"
            className="field-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <p className="mt-2 text-xs leading-relaxed text-ink/50">
            We&apos;ll email you a 6-digit code — no password to remember.
          </p>
        </div>

        <Button type="submit" tone="light" pill disabled={loading} className="w-full">
          {loading ? "Sending…" : "Email me a code"}
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={verifyCode} className="space-y-6">
      <p className="text-sm leading-relaxed text-ink/70">
        We sent a 6-digit code to <span className="font-semibold text-navy">{email}</span>. It
        expires in 10 minutes.
      </p>

      {error ? (
        <p className="border border-navy/20 bg-navy/5 px-4 py-3 text-sm text-navy" role="alert">
          {error}
        </p>
      ) : null}

      <div>
        <label htmlFor="portal-code" className="field-label field-label-on-light">
          Sign-in code
        </label>
        <input
          id="portal-code"
          ref={codeRef}
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={7}
          required
          placeholder="000000"
          className="field-input text-center font-display text-2xl tracking-[0.6em]"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/[^\d\s]/g, ""))}
        />
      </div>

      <Button
        type="submit"
        tone="light"
        pill
        disabled={loading || code.replace(/\D/g, "").length !== 6}
        className="w-full"
      >
        {loading ? "Checking…" : "Sign in"}
      </Button>

      <div className="flex items-center justify-between text-xs text-ink/55">
        <button
          type="button"
          className="editorial-link"
          disabled={loading || cooldown > 0}
          onClick={() => requestCode()}
        >
          {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
        </button>
        <button
          type="button"
          className="editorial-link"
          onClick={() => {
            setStep("email");
            setError("");
          }}
        >
          Use a different email
        </button>
      </div>
    </form>
  );
}
