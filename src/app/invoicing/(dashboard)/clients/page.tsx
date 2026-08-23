import Link from "next/link";
import { NewClientForm } from "@/components/portal/NewClientForm";
import { checklistProgress } from "@/lib/portal/checklist";
import { listClients } from "@/lib/portal/service";

export default async function StaffClientsPage() {
  const clients = await listClients();

  return (
    <div>
      <div className="inv-page-header">
        <div>
          <h1 className="inv-page-title">Portal clients</h1>
          <p className="inv-page-subtitle">
            Who can sign in at 8emedia.com/portal and submit requests.
          </p>
        </div>
      </div>

      <NewClientForm />

      {clients.length > 0 ? (
        <div className="inv-table-wrap mt-6">
          <table className="inv-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Contact</th>
                <th>Email</th>
                <th>Type</th>
                <th>GHL</th>
                <th>Checklist</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => {
                const progress = checklistProgress(c.onboarding_checklist ?? {}, c.client_type ?? "local");
                return (
                  <tr key={c.id}>
                    <td>
                      <Link href={`/invoicing/clients/${c.id}`} className="inv-link">
                        {c.company}
                      </Link>
                    </td>
                    <td>{c.contact_name}</td>
                    <td>{c.email}</td>
                    <td style={{ textTransform: "capitalize" }}>{c.client_type ?? "local"}</td>
                    <td>
                      <span className={`inv-badge ${c.ghl_location_id ? "inv-badge-paid" : "inv-badge-open"}`}>
                        {c.ghl_location_id ? "Connected" : "Not connected"}
                      </span>
                    </td>
                    <td>
                      <span className={`inv-badge ${progress.percent === 100 ? "inv-badge-paid" : "inv-badge-open"}`}>
                        {progress.requiredDone}/{progress.requiredTotal} req · {progress.percent}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="inv-empty mt-6">
          <div className="inv-empty-title">No portal clients yet</div>
          <p className="inv-empty-text">
            Create the first one above — they sign in with their email, no code to share.
          </p>
        </div>
      )}
    </div>
  );
}
