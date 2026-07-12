import { NextResponse } from "next/server";
import { requireInvoicingAuth } from "@/lib/invoicing/auth";
import { generateAccessCode, hashAccessCode } from "@/lib/portal/auth";
import { getClientById, setClientAccessCode } from "@/lib/portal/service";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireInvoicingAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const client = await getClientById(id);
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const accessCode = generateAccessCode();
    await setClientAccessCode(id, hashAccessCode(accessCode));

    return NextResponse.json({ accessCode });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to reset access code";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
