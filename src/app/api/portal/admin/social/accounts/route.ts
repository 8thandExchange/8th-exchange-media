import { NextResponse } from "next/server";
import { requireInvoicingAuth } from "@/lib/invoicing/auth";
import { listSocialAccounts } from "@/lib/ghl";
import { resolveGhlAuth } from "@/lib/portal/ghlAuth";
import { syncSocialAccounts } from "@/lib/portal/social";

export async function GET(request: Request) {
  try {
    await requireInvoicingAuth();
    const clientId = new URL(request.url).searchParams.get("clientId");
    const { auth } = await resolveGhlAuth(clientId);
    const { accounts } = await listSocialAccounts(auth);
    return NextResponse.json({ accounts });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}

/** Sync the brand's connected accounts from GHL into the local registry. */
export async function POST(request: Request) {
  try {
    await requireInvoicingAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as { clientId?: string };
    const clientId = body.clientId || null;
    const { auth } = await resolveGhlAuth(clientId);
    const registry = await syncSocialAccounts(clientId, auth);
    return NextResponse.json({ ok: true, registry });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
