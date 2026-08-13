import Link from "next/link";
import { NewClientForm, ResetCodeButton } from "@/components/portal/NewClientForm";
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
                <th>Access code</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link href={`/invoicing/clients/${c.id}`} className="inv-link">
                      {c.company}
                    </Link>
                  </td>
                  <td>{c.contact_name}</td>
                  <td>{c.email}</td>
                  <td>
                    <ResetCodeButton clientId={c.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="inv-empty mt-6">
          <div className="inv-empty-title">No portal clients yet</div>
          <p className="inv-empty-text">Create the first one above and share the access code.</p>
        </div>
      )}
    </div>
  );
}
