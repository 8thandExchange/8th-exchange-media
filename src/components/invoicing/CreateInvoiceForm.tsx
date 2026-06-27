"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { CustomerSummary, ProductOption } from "@/lib/invoicing/types";

interface LineItemState {
  id: string;
  priceId: string;
  description: string;
  quantity: number;
  unitAmount: number;
}

interface CreateInvoiceFormProps {
  customers: CustomerSummary[];
  products: ProductOption[];
}

function emptyLineItem(): LineItemState {
  return {
    id: crypto.randomUUID(),
    priceId: "",
    description: "",
    quantity: 1,
    unitAmount: 0,
  };
}

export function CreateInvoiceForm({ customers, products }: CreateInvoiceFormProps) {
  const router = useRouter();
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? "");
  const [daysUntilDue, setDaysUntilDue] = useState(30);
  const [memo, setMemo] = useState("");
  const [footer, setFooter] = useState("Thank you for your business.");
  const [autoSend, setAutoSend] = useState(true);
  const [lineItems, setLineItems] = useState<LineItemState[]>([emptyLineItem()]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const allPrices = products.flatMap((product) =>
    product.prices.map((price) => ({
      ...price,
      productName: product.name,
    }))
  );

  function updateLineItem(id: string, updates: Partial<LineItemState>) {
    setLineItems((items) =>
      items.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  }

  function handlePriceSelect(lineId: string, priceId: string) {
    const price = allPrices.find((entry) => entry.id === priceId);
    updateLineItem(lineId, {
      priceId,
      description: price
        ? `${price.productName}${price.nickname ? ` — ${price.nickname}` : ""}`
        : "",
      unitAmount: price?.unitAmount ?? 0,
    });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/invoicing/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          daysUntilDue,
          memo,
          footer,
          autoSend,
          lineItems: lineItems.map((item) => ({
            priceId: item.priceId || undefined,
            description: item.description,
            quantity: item.quantity,
            unitAmount: item.priceId ? undefined : item.unitAmount,
          })),
        }),
      });

      const data = (await response.json()) as { error?: string; id?: string };
      if (!response.ok) throw new Error(data.error ?? "Failed to create invoice");

      router.push(`/invoicing/invoices/${data.id}`);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="inv-form-grid">
      {error ? <div className="inv-alert inv-alert-error">{error}</div> : null}

      <div className="inv-card inv-detail-section inv-form-grid inv-form-grid-2">
        <div className="inv-field">
          <label className="inv-label" htmlFor="customer">
            Customer
          </label>
          <select
            id="customer"
            className="inv-select"
            value={customerId}
            onChange={(event) => setCustomerId(event.target.value)}
            required
          >
            {customers.length === 0 ? (
              <option value="">Add a customer first</option>
            ) : (
              customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                  {customer.email ? ` (${customer.email})` : ""}
                </option>
              ))
            )}
          </select>
        </div>
        <div className="inv-field">
          <label className="inv-label" htmlFor="due">
            Payment terms (days)
          </label>
          <input
            id="due"
            type="number"
            min={1}
            className="inv-input"
            value={daysUntilDue}
            onChange={(event) => setDaysUntilDue(Number(event.target.value))}
          />
        </div>
      </div>

      <div className="inv-card">
        <div className="inv-detail-section">
          <div className="inv-detail-label">Line items</div>
          <div className="inv-line-items">
            {lineItems.map((item) => (
              <div key={item.id} className="inv-line-item">
                <div className="inv-field">
                  {allPrices.length > 0 ? (
                    <select
                      className="inv-select"
                      value={item.priceId}
                      onChange={(event) => handlePriceSelect(item.id, event.target.value)}
                    >
                      <option value="">Custom line item</option>
                      {allPrices.map((price) => (
                        <option key={price.id} value={price.id}>
                          {price.productName}
                          {price.nickname ? ` — ${price.nickname}` : ""}
                        </option>
                      ))}
                    </select>
                  ) : null}
                  <input
                    className="inv-input"
                    placeholder="Description"
                    value={item.description}
                    onChange={(event) =>
                      updateLineItem(item.id, { description: event.target.value })
                    }
                    required
                  />
                </div>
                <div className="inv-field">
                  <label className="inv-label">Qty</label>
                  <input
                    type="number"
                    min={1}
                    className="inv-input"
                    value={item.quantity}
                    onChange={(event) =>
                      updateLineItem(item.id, { quantity: Number(event.target.value) })
                    }
                  />
                </div>
                {!item.priceId ? (
                  <div className="inv-field">
                    <label className="inv-label">Amount (USD)</label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      className="inv-input"
                      value={(item.unitAmount / 100).toFixed(2)}
                      onChange={(event) =>
                        updateLineItem(item.id, {
                          unitAmount: Math.round(Number(event.target.value) * 100),
                        })
                      }
                    />
                  </div>
                ) : (
                  <div className="text-[14px] text-[var(--inv-text-secondary)]">
                    ${((item.unitAmount * item.quantity) / 100).toFixed(2)}
                  </div>
                )}
                <button
                  type="button"
                  className="inv-btn inv-btn-ghost"
                  onClick={() =>
                    setLineItems((items) =>
                      items.length === 1 ? items : items.filter((row) => row.id !== item.id)
                    )
                  }
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <div className="mt-3">
            <button
              type="button"
              className="inv-btn inv-btn-secondary"
              onClick={() => setLineItems((items) => [...items, emptyLineItem()])}
            >
              Add line item
            </button>
          </div>
        </div>
      </div>

      <div className="inv-card inv-detail-section inv-form-grid inv-form-grid-2">
        <div className="inv-field">
          <label className="inv-label" htmlFor="memo">
            Memo
          </label>
          <textarea
            id="memo"
            className="inv-textarea"
            value={memo}
            onChange={(event) => setMemo(event.target.value)}
            placeholder="Optional note visible on the invoice"
          />
        </div>
        <div className="inv-field">
          <label className="inv-label" htmlFor="footer">
            Footer
          </label>
          <textarea
            id="footer"
            className="inv-textarea"
            value={footer}
            onChange={(event) => setFooter(event.target.value)}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-[14px]">
        <input
          type="checkbox"
          checked={autoSend}
          onChange={(event) => setAutoSend(event.target.checked)}
        />
        Send invoice to customer immediately
      </label>

      <div className="inv-action-row">
        <button type="submit" className="inv-btn inv-btn-primary" disabled={loading || !customerId}>
          {loading ? "Creating..." : autoSend ? "Create & send invoice" : "Create invoice"}
        </button>
      </div>
    </form>
  );
}
