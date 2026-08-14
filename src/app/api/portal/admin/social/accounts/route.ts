import { NextResponse } from "next/server";
import { requireInvoicingAuth } from "@/lib/invoicing/auth";
import { listSocialAccounts } from "@/lib/ghl";
import { resolveGhlAuth } from "@/lib/portal/ghlAuth";

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
