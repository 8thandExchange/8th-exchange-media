import { agencyMetaFromEnv, type MetaAuth } from "@/lib/meta";
import { getClientById } from "@/lib/portal/service";
import { getMetaConnection } from "@/lib/portal/metaStore";

/**
 * Resolve which Meta ad account a staff action should run against.
 * No clientId → 8E Media (stored agency row, else env). A clientId →
 * that client's stored credentials, so spend lands on *their* Page.
 *
 * Server-only (reads the access token). Throws with a staff-actionable
 * message when the target isn't configured.
 */
export async function resolveMetaAuth(
  clientId: string | null
): Promise<{ auth: MetaAuth; label: string }> {
  if (!clientId) {
    const stored = await getMetaConnection(null);
    const env = agencyMetaFromEnv();
    const accessToken = stored?.accessToken || env?.accessToken;
    const adAccountId = stored?.adAccountId || env?.adAccountId;
    if (!accessToken || !adAccountId) {
      throw new Error(
        "8E Media has no Meta connection yet — paste a System User token and ad account id on Ads, or set META_ACCESS_TOKEN and META_AD_ACCOUNT_ID in Vercel."
      );
    }
    return {
      auth: {
        accessToken,
        adAccountId,
        pixelId: stored?.pixelId || env?.pixelId || null,
        businessId: stored?.businessId || env?.businessId || null,
        pageId: stored?.pageId || env?.pageId || null,
      },
      label: "8E Media",
    };
  }

  const client = await getClientById(clientId);
  if (!client) throw new Error("Unknown client");

  const stored = await getMetaConnection(clientId);
  if (!stored?.accessToken || !stored.adAccountId) {
    throw new Error(
      `${client.company} has no Meta connection yet — add their System User token and ad account id on the client page.`
    );
  }
  return {
    auth: {
      accessToken: stored.accessToken,
      adAccountId: stored.adAccountId,
      pixelId: stored.pixelId,
      businessId: stored.businessId,
      pageId: stored.pageId,
    },
    label: client.company,
  };
}

/** Best-effort agency auth for CAPI on public forms. Null = skip, don't throw. */
export async function agencyMetaAuthForCapi(): Promise<MetaAuth | null> {
  try {
    const { auth } = await resolveMetaAuth(null);
    return auth.pixelId ? auth : null;
  } catch {
    return null;
  }
}
