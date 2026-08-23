import { NextResponse } from "next/server";
import { requireInvoicingAuth } from "@/lib/invoicing/auth";
import { listSocialAccounts } from "@/lib/ghl";
import { getClientById, setClientGhl, updateClientGhlMeta } from "@/lib/portal/service";

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
      scopes?: string;
      rotationDue?: string;
    };

    const scopes = body.scopes?.trim().slice(0, 500) || null;
    const rotationDue = /^\d{4}-\d{2}-\d{2}$/.test(body.rotationDue?.trim() ?? "")
      ? body.rotationDue!.trim()
      : null;

    if (body.action === "disconnect") {
      await setClientGhl(id, null, null);
      return NextResponse.json({ ok: true, connected: false });
    }

    if (body.action === "metadata") {
      if (!client.ghl_location_id) {
        return NextResponse.json(
          { error: "Connect a location and token before saving scopes or a rotation date." },
          { status: 400 }
        );
      }
      await updateClientGhlMeta(id, { scopes, rotationDue });
      return NextResponse.json({ ok: true, connected: true, scopes, rotationDue });
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

    await setClientGhl(id, locationId, apiToken, { scopes, rotationDue });
    return NextResponse.json({
      ok: true,
      connected: true,
      tokenLast4: apiToken.slice(-4),
      scopes,
      rotationDue,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update GHL connection";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
