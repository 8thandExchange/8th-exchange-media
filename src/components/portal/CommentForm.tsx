"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

interface CommentFormProps {
  endpoint: string;
  placeholder?: string;
  buttonLabel?: string;
}

/** Posts { body } to the given endpoint and refreshes the page. */
export function CommentForm({
  endpoint,
  placeholder = "Write a message…",
  buttonLabel = "Send",
}: CommentFormProps) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!body.trim()) return;
    setLoading(true);
    setError("");

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? "Failed to send message");
        return;
      }

      setBody("");
      router.refresh();
    } catch {
      setError("Failed to send message — please try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error ? (
        <p className="border border-navy/20 bg-navy/5 px-4 py-2 text-sm text-navy">{error}</p>
      ) : null}
      <textarea
        rows={3}
        required
        placeholder={placeholder}
        className="field-input resize-y"
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <Button type="submit" tone="light" pill disabled={loading || !body.trim()}>
        {loading ? "Sending…" : buttonLabel}
      </Button>
    </form>
  );
}
