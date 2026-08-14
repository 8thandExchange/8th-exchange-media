"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

function EyeIcon({ off }: { off?: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12Z" />
      <circle cx="12" cy="12" r="2.75" />
      {off ? <line x1="4" y1="20" x2="20" y2="4" /> : null}
    </svg>
  );
}

export default function InvoicingLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState(searchParams.get("error") ? "Invalid password" : "");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/invoicing/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        setError("Invalid password");
        return;
      }

      router.push(searchParams.get("next") ?? "/invoicing");
      router.refresh();
    } catch {
      setError("Unable to sign in");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-5 py-16">
      <div className="w-full max-w-md">
        <div className="border-hairline bg-paper p-8 shadow-[0_24px_64px_-32px_rgba(11,27,61,0.3)] md:p-10">
          <div className="mb-8 text-center">
            <Image
              src="/brand/assets/logo/coin-primary-antiqued.png"
              alt="8th & Exchange Media"
              width={56}
              height={56}
              className="mx-auto mb-5"
            />
            <h1 className="font-display text-2xl text-navy">Studio Dashboard</h1>
            <p className="mt-2 text-sm text-ink/60">
              Invoices, clients, leads, and the Social Planner.
            </p>
          </div>

          {error ? (
            <p
              className="mb-6 border border-navy/20 bg-navy/5 px-4 py-3 text-sm text-navy"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="field-label field-label-on-light">
                Admin password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={show ? "text" : "password"}
                  className="field-input pr-11"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  autoFocus
                  required
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-ink/45 transition-colors hover:text-navy"
                  aria-label={show ? "Hide password" : "Show password"}
                  aria-pressed={show}
                >
                  <EyeIcon off={show} />
                </button>
              </div>
            </div>

            <Button type="submit" tone="light" pill disabled={loading} className="w-full">
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-ink/50">
          Staff only ·{" "}
          <Link href="/" className="text-navy underline underline-offset-4">
            Back to site
          </Link>
        </p>
      </div>
    </main>
  );
}
