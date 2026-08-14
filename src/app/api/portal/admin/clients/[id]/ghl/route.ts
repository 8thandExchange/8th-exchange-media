import { NextResponse } from "next/server";
import { requireInvoicingAuth } from "@/lib/invoicing/auth";
import { listSocialAccounts } from "@/lib/ghl";
import { getClientById, setClientGhl } from "@/lib/portal/service";

/**
 * Set or clear a client's GHL sub-account connection.
 * The token is write-only: it is stored server-side and never echoed back.
 */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireInvoicingAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const client = await getClientById(id);
  if (!client) {
    return NextResponse.json({ error: "Unknown client" }, { status: 404 });
  }

  try {
    const body = (await request.json()) as {
      locationId?: string;
      apiToken?: string;
      action?: string;
    };

    if (body.action === "disconnect") {
      await setClientGhl(id, null, null);
      return NextResponse.json({ ok: true, connected: false });
    }

    const locationId = body.locationId?.trim();
    const apiToken = body.apiToken?.trim();
    if (!locationId || !apiToken) {
      return NextResponse.json(
        { error: "Both the location id and the Private Integration token are required" },
        { status: 400 }
      );
    }

    // Prove the pair works before saving it: one cheap read against the
    // client's sub-account. A bad token/location fails here, not at post time.
    try {
      await listSocialAccounts({ token: apiToken, locationId });
    } catch {
      return NextResponse.json(
        {
          error:
            "Go High Level rejected those credentials — check the location id and that the Private Integration token belongs to that sub-account (with Social Planner scopes).",
        },
        { status: 400 }
      );
    }

    await setClientGhl(id, locationId, apiToken);
    return NextResponse.json({ ok: true, connected: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update GHL connection";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
