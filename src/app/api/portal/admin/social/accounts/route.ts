import { NextResponse } from "next/server";
import { requireInvoicingAuth } from "@/lib/invoicing/auth";
import { listSocialAccounts } from "@/lib/ghl";

export async function GET() {
  try {
    await requireInvoicingAuth();
    const { accounts } = await listSocialAccounts();
    return NextResponse.json({ accounts });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}
