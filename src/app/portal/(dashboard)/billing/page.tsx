import { redirect } from "next/navigation";
import { InvoiceStatusBadge } from "@/components/invoicing/InvoiceStatusBadge";
import { getPortalClientId } from "@/lib/portal/auth";
import { getClientById } from "@/lib/portal/service";
import { listInvoicesForCustomer } from "@/lib/invoicing/service";
import { formatDate, formatMoney } from "@/lib/invoicing/format";
import type { InvoiceStatus } from "@/lib/invoicing/types";

/**
 * Client billing — read straight from Stripe by the client's customer id.
 * Stripe is the invoicing database; there is no local mirror, and the
 * scoping filter is applied Stripe-side in listInvoicesForCustomer.
 */
export default async function PortalBillingPage() {
  const clientId = await getPortalClientId();
  if (!clientId) redirect("/portal/login");

  const client = await getClientById(clientId);
  if (!client) redirect("/portal/login");

  if (!client.stripe_customer_id) {
    return (
      <div>
        <div className="inv-page-header">
          <div>
            <h1 className="inv-page-title">Invoices</h1>
            <p className="inv-page-subtitle">Your billing history with 8th &amp; Exchange.</p>
          </div>
        </div>
        <div className="inv-card">
          <div className="inv-empty">
            <p className="inv-empty-title">No billing set up yet.</p>
            <p className="inv-empty-text">
              Once your first invoice is issued, it will appear here with a secure payment link.
            </p>
          </div>
        </div>
      </div>
    );
  }

  let invoices: Awaited<ReturnType<typeof listInvoicesForCustomer>> = [];
  let loadError = false;
  try {
    invoices = (await listInvoicesForCustomer(client.stripe_customer_id)).filter(
      (i) => i.status !== "draft"
    );
  } catch (error) {
    console.error("Portal billing: Stripe fetch failed", error);
    loadError = true;
  }

  const open = invoices.filter((i) => i.status === "open" || i.displayStatus === "overdue");
  const openBalance = open.reduce((sum, i) => sum + i.amountDue, 0);
  const paidTotal = invoices
    .filter((i) => i.status === "paid")
    .reduce((sum, i) => sum + i.amountPaid, 0);
  const currency = invoices[0]?.currency ?? "usd";

  return (
    <div>
      <div className="inv-page-header">
        <div>
          <h1 className="inv-page-title">Invoices</h1>
          <p className="inv-page-subtitle">Your billing history with 8th &amp; Exchange.</p>
        </div>
      </div>

      {loadError ? (
        <div className="inv-alert inv-alert-error">
          We couldn&apos;t load your invoices just now. Refresh in a minute, or email{" "}
          <a href="mailto:media@8thandexchange.com" className="inv-link">
            media@8thandexchange.com
          </a>
          .
        </div>
      ) : (
        <>
          <div className="inv-stat-grid" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
            <div className="inv-card inv-stat-card">
              <div className="inv-stat-label">Open balance</div>
              <div className="inv-stat-value">{formatMoney(openBalance, currency)}</div>
              <div className="inv-stat-meta">
                {open.length} open invoice{open.length === 1 ? "" : "s"}
              </div>
            </div>
            <div className="inv-card inv-stat-card">
              <div className="inv-stat-label">Paid to date</div>
              <div className="inv-stat-value">{formatMoney(paidTotal, currency)}</div>
              <div className="inv-stat-meta">across {invoices.length} invoices</div>
            </div>
          </div>

          <div className="inv-card">
            {invoices.length === 0 ? (
              <div className="inv-empty">
                <p className="inv-empty-title">No invoices yet.</p>
                <p className="inv-empty-text">
                  Your first invoice will appear here with a secure payment link.
                </p>
              </div>
            ) : (
              <div className="inv-table-wrap">
                <table className="inv-table">
                  <thead>
                    <tr>
                      <th>Invoice</th>
                      <th>Status</th>
                      <th>Due</th>
                      <th style={{ textAlign: "right" }}>Amount</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice) => (
                      <tr key={invoice.id}>
                        <td style={{ fontWeight: 500 }}>{invoice.number ?? invoice.id}</td>
                        <td>
                          <InvoiceStatusBadge
                            status={
                              invoice.displayStatus === "overdue"
                                ? "overdue"
                                : (invoice.status as InvoiceStatus)
                            }
                          />
                        </td>
                        <td style={{ color: "var(--inv-text-secondary)" }}>
                          {formatDate(invoice.dueDate)}
                        </td>
                        <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>
                          {formatMoney(invoice.status === "paid" ? invoice.amountPaid : invoice.amountDue, invoice.currency)}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          {invoice.hostedInvoiceUrl ? (
                            <a
                              href={invoice.hostedInvoiceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inv-link"
                            >
                              {invoice.status === "open" ? "View & pay" : "View"}
                            </a>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
