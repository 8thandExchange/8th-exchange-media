"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

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
      {error ? <div className="inv-alert inv-alert-error">{error}</div> : null}
      <textarea
        rows={3}
        required
        placeholder={placeholder}
        className="inv-textarea"
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <button type="submit" className="inv-btn inv-btn-primary" disabled={loading || !body.trim()}>
        {loading ? "Sending…" : buttonLabel}
      </button>
    </form>
  );
}
