"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { CustomerSummary, ProductOption } from "@/lib/invoicing/types";

interface LineItemState {
  id: string;
  priceId: string;
  description: string;
  quantity: number;
  unitAmount: number; // cents
}

interface CreateInvoiceFormProps {
  customers: CustomerSummary[];
  products: ProductOption[];
}

/** Net-terms presets. value is days_until_due; "custom" reveals a date picker. */
const TERMS_PRESETS: { value: string; label: string; hint: string }[] = [
  { value: "0", label: "Due on receipt", hint: "Payable immediately" },
  { value: "7", label: "Net 7", hint: "7 days" },
  { value: "15", label: "Net 15", hint: "15 days" },
  { value: "30", label: "Net 30", hint: "30 days" },
  { value: "60", label: "Net 60", hint: "60 days" },
  { value: "custom", label: "Custom date", hint: "Pick a date" },
];

function emptyLineItem(): LineItemState {
  return {
    id: crypto.randomUUID(),
    priceId: "",
    description: "",
    quantity: 1,
    unitAmount: 0,
  };
}

function money(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

function formatLongDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function CreateInvoiceForm({ customers, products }: CreateInvoiceFormProps) {
  const router = useRouter();
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? "");
  const [terms, setTerms] = useState<string>("30");
  const [customDate, setCustomDate] = useState<string>(
    toDateInputValue(addDays(new Date(), 30))
  );
  const [memo, setMemo] = useState("");
  const [footer, setFooter] = useState("Thank you for your business.");
  const [lineItems, setLineItems] = useState<LineItemState[]>([emptyLineItem()]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<"send" | "draft" | null>(null);

  const allPrices = useMemo(
    () =>
      products.flatMap((product) =>
        product.prices.map((price) => ({ ...price, productName: product.name }))
      ),
    [products]
  );

  const selectedCustomer = customers.find((c) => c.id === customerId) ?? null;
  const customerHasEmail = Boolean(selectedCustomer?.email);

  const subtotal = useMemo(
    () => lineItems.reduce((sum, item) => sum + item.unitAmount * item.quantity, 0),
    [lineItems]
  );

  const dueDate = useMemo(() => {
    if (terms === "custom") {
      const parsed = customDate ? new Date(`${customDate}T12:00:00`) : null;
      return parsed && !Number.isNaN(parsed.getTime()) ? parsed : null;
    }
    return addDays(new Date(), Number(terms));
  }, [terms, customDate]);

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

  async function submit(mode: "send" | "draft") {
    setError(null);

    if (mode === "send" && !customerHasEmail) {
      setError(
        "This customer has no email on file, so the invoice can't be emailed. Add an email on the customer record, or save it as a draft."
      );
      return;
    }
    if (subtotal <= 0) {
      setError("Add at least one line item with an amount greater than $0.");
      return;
    }

    setLoading(mode);

    const payload: Record<string, unknown> = {
      customerId,
      memo,
      footer,
      autoSend: mode === "send",
      lineItems: lineItems.map((item) => ({
        priceId: item.priceId || undefined,
        description: item.description,
        quantity: item.quantity,
        unitAmount: item.priceId ? undefined : item.unitAmount,
      })),
    };

    if (terms === "custom") {
      if (!dueDate) {
        setError("Pick a valid due date.");
        setLoading(null);
        return;
      }
      payload.dueDate = Math.floor(dueDate.getTime() / 1000);
    } else {
      payload.daysUntilDue = Number(terms);
    }

    try {
      const response = await fetch("/api/invoicing/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as { error?: string; id?: string };
      if (!response.ok) throw new Error(data.error ?? "Failed to create invoice");

      router.push(`/invoicing/invoices/${data.id}`);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Something went wrong");
      setLoading(null);
    }
  }

  return (
    <div className="inv-form-grid">
      {error ? <div className="inv-alert inv-alert-error">{error}</div> : null}

      {/* Bill to + terms */}
      <div className="inv-card inv-detail-section inv-form-grid">
        <div className="inv-form-grid inv-form-grid-2">
          <div className="inv-field">
            <label className="inv-label" htmlFor="customer">
              Bill to
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
            {selectedCustomer && !customerHasEmail ? (
              <div className="inv-notice inv-notice-warn">
                No email on file — this customer can’t be emailed. Save as draft, or{" "}
                <a className="inv-link" href={`/invoicing/customers/${selectedCustomer.id}/edit`}>
                  add an email
                </a>
                .
              </div>
            ) : null}
          </div>

          <div className="inv-field">
            <label className="inv-label">Payment terms</label>
            <div className="inv-segmented" role="radiogroup" aria-label="Payment terms">
              {TERMS_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  role="radio"
                  aria-checked={terms === preset.value}
                  title={preset.hint}
                  className={`inv-segment ${terms === preset.value ? "active" : ""}`}
                  onClick={() => setTerms(preset.value)}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            {terms === "custom" ? (
              <input
                type="date"
                className="inv-input mt-2"
                value={customDate}
                min={toDateInputValue(new Date())}
                onChange={(event) => setCustomDate(event.target.value)}
              />
            ) : null}
            <div className="inv-help">
              {dueDate ? (
                terms === "0" ? (
                  <>Due <strong>on receipt</strong> · {formatLongDate(dueDate)}</>
                ) : (
                  <>Due <strong>{formatLongDate(dueDate)}</strong></>
                )
              ) : (
                "Pick a valid due date"
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Line items */}
      <div className="inv-card">
        <div className="inv-detail-section">
          <div className="inv-detail-label">Line items</div>
          <div className="inv-line-items">
            <div className="inv-line-head">
              <span>Description</span>
              <span>Qty</span>
              <span>Rate</span>
              <span className="inv-line-head-amount">Amount</span>
              <span aria-hidden />
            </div>
            {lineItems.map((item) => {
              const lineTotal = item.unitAmount * item.quantity;
              return (
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
                    <label className="inv-label inv-line-mlabel">Qty</label>
                    <input
                      type="number"
                      min={1}
                      className="inv-input"
                      value={item.quantity}
                      onChange={(event) =>
                        updateLineItem(item.id, {
                          quantity: Math.max(1, Number(event.target.value) || 1),
                        })
                      }
                    />
                  </div>

                  <div className="inv-field">
                    <label className="inv-label inv-line-mlabel">Rate (USD)</label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      className="inv-input"
                      disabled={Boolean(item.priceId)}
                      value={(item.unitAmount / 100).toFixed(2)}
                      onChange={(event) =>
                        updateLineItem(item.id, {
                          unitAmount: Math.round((Number(event.target.value) || 0) * 100),
                        })
                      }
                    />
                  </div>

                  <div className="inv-line-amount">{money(lineTotal)}</div>

                  <button
                    type="button"
                    className="inv-btn inv-btn-ghost inv-line-remove"
                    aria-label="Remove line item"
                    disabled={lineItems.length === 1}
                    onClick={() =>
                      setLineItems((items) =>
                        items.length === 1 ? items : items.filter((row) => row.id !== item.id)
                      )
                    }
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>

          <div className="inv-line-foot">
            <button
              type="button"
              className="inv-btn inv-btn-secondary"
              onClick={() => setLineItems((items) => [...items, emptyLineItem()])}
            >
              + Add line item
            </button>
            <div className="inv-totals">
              <div className="inv-totals-row">
                <span>Subtotal</span>
                <span>{money(subtotal)}</span>
              </div>
              <div className="inv-totals-row inv-totals-grand">
                <span>Total due</span>
                <span>{money(subtotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
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

      {/* Actions */}
      <div className="inv-submit-bar">
        <div className="inv-submit-summary">
          <span className="inv-submit-total">{money(subtotal)}</span>
          <span className="inv-submit-meta">
            {selectedCustomer ? selectedCustomer.name : "No customer"} ·{" "}
            {dueDate
              ? terms === "0"
                ? "Due on receipt"
                : `Due ${formatLongDate(dueDate)}`
              : "No due date"}
          </span>
        </div>
        <div className="inv-action-row">
          <button
            type="button"
            className="inv-btn inv-btn-secondary"
            disabled={loading !== null || !customerId}
            onClick={() => submit("draft")}
          >
            {loading === "draft" ? "Saving…" : "Save as draft"}
          </button>
          <button
            type="button"
            className="inv-btn inv-btn-primary"
            disabled={loading !== null || !customerId || !customerHasEmail}
            title={!customerHasEmail ? "Add a customer email to send" : undefined}
            onClick={() => submit("send")}
          >
            {loading === "send" ? "Sending…" : "Create & send invoice"}
          </button>
        </div>
      </div>
    </div>
  );
}
