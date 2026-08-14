import { agencyGhlAuth, type GhlAuth } from "@/lib/ghl";
import { getClientById, getClientGhlAuth } from "@/lib/portal/service";

/**
 * Resolve which GHL sub-account a staff action should run against.
 * No clientId → the agency's own sub-account (env). A clientId → that
 * client's stored credentials, so campaigns land in the client's GHL
 * location — never the agency's.
 *
 * Server-only (reads the client's API token). Throws with a
 * staff-actionable message when the target isn't configured.
 */
export async function resolveGhlAuth(
  clientId: string | null
): Promise<{ auth: GhlAuth; label: string }> {
  if (!clientId) {
    const auth = agencyGhlAuth();
    if (!auth) {
      throw new Error("Agency GHL is not configured (GHL_API_TOKEN / GHL_LOCATION_ID)");
    }
    return { auth, label: "8E Media" };
  }

  const client = await getClientById(clientId);
  if (!client) throw new Error("Unknown client");

  const auth = await getClientGhlAuth(clientId);
  if (!auth) {
    throw new Error(
      `${client.company} has no Go High Level connection yet — add their location id and Private Integration token on the client page.`
    );
  }
  return { auth, label: client.company };
}
