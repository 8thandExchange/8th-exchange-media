import { agencyMetaAuth, type MetaAuth } from "@/lib/meta";
import { getClientById, getClientMetaAuth } from "@/lib/portal/service";

/**
 * Resolve which Meta ad account a staff action should run against.
 * No clientId → the agency's own account (env). A clientId → that
 * client's stored credentials, so campaigns land in *their* ad account
 * — never 8E's.
 *
 * Server-only (reads the client's access token). Throws with a
 * staff-actionable message when the target isn't configured.
 */
export async function resolveMetaAuth(
  clientId: string | null
): Promise<{ auth: MetaAuth; label: string }> {
  if (!clientId) {
    const auth = agencyMetaAuth();
    if (!auth) {
      throw new Error(
        "Agency Meta is not configured. Add META_ACCESS_TOKEN and META_AD_ACCOUNT_ID in Vercel → 8th-exchange-media → Settings → Environment Variables (then redeploy). The Ads page has the exact Business Manager steps."
      );
    }
    return { auth, label: "8E Media" };
  }

  const client = await getClientById(clientId);
  if (!client) throw new Error("Unknown client");

  const auth = await getClientMetaAuth(clientId);
  if (!auth) {
    throw new Error(
      `${client.company} has no Meta connection yet — add their ad account id and system-user token on the client page.`
    );
  }
  return { auth, label: client.company };
}
