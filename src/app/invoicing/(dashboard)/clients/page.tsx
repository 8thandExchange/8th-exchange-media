import Link from "next/link";
import { NewClientForm } from "@/components/portal/NewClientForm";
import { CHECKLIST_TOTAL, checklistProgress } from "@/lib/portal/checklist";
import { listClients, listClientsMetaStatus } from "@/lib/portal/service";

export default async function StaffClientsPage() {
  const clients = await listClients();
  let metaById = new Map<string, boolean>();
  try {
    metaById = new Map(
      (await listClientsMetaStatus()).map((row) => [row.id, row.connected])
    );
  } catch (error) {
    console.error("Clients: could not load Meta status", error);
  }

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
                <th>GHL</th>
                <th>Meta</th>
                <th>Checklist</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => {
                const done = checklistProgress(c.onboarding_checklist ?? {});
                return (
                  <tr key={c.id}>
                    <td>
                      <Link href={`/invoicing/clients/${c.id}`} className="inv-link">
                        {c.company}
                      </Link>
                    </td>
                    <td>{c.contact_name}</td>
                    <td>{c.email}</td>
                    <td>
                      <span className={`inv-badge ${c.ghl_location_id ? "inv-badge-paid" : "inv-badge-open"}`}>
                        {c.ghl_location_id ? "Connected" : "Not connected"}
                      </span>
                    </td>
                    <td>
                      <span className={`inv-badge ${metaById.get(c.id) ? "inv-badge-paid" : "inv-badge-open"}`}>
                        {metaById.get(c.id) ? "Connected" : "Not connected"}
                      </span>
                    </td>
                    <td>
                      <span className={`inv-badge ${done === CHECKLIST_TOTAL ? "inv-badge-paid" : "inv-badge-open"}`}>
                        {done}/{CHECKLIST_TOTAL}
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
