import { NextResponse } from "next/server";
import { requireInvoicingAuth } from "@/lib/invoicing/auth";
import { createInvoice, listInvoices } from "@/lib/invoicing/service";
import type { LineItemInput } from "@/lib/invoicing/types";

export async function GET() {
  try {
    await requireInvoicingAuth();
    const invoices = await listInvoices();
    return NextResponse.json({ invoices });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireInvoicingAuth();
    const body = (await request.json()) as {
      customerId?: string;
      lineItems?: LineItemInput[];
      daysUntilDue?: number;
      memo?: string;
      footer?: string;
      autoSend?: boolean;
    };

    if (!body.customerId || !body.lineItems?.length) {
      return NextResponse.json({ error: "Customer and line items are required" }, { status: 400 });
    }

    const invoice = await createInvoice({
      customerId: body.customerId,
      lineItems: body.lineItems,
      daysUntilDue: body.daysUntilDue,
      memo: body.memo,
      footer: body.footer,
      autoSend: body.autoSend,
    });

    return NextResponse.json(invoice);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create invoice";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
