import { NextResponse } from "next/server";
import {
  createPortalSession,
  destroyPortalSession,
  verifyAccessCode,
} from "@/lib/portal/auth";
import { getClientByEmail } from "@/lib/portal/service";

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = (await request.json()) as {
      email?: string;
      accessCode?: string;
      action?: string;
    };

    if (body.action === "logout") {
      await destroyPortalSession();
      return NextResponse.json({ ok: true });
    }

    if (!body.email?.trim() || !body.accessCode?.trim()) {
      return NextResponse.json({ error: "Email and access code are required" }, { status: 400 });
    }

    const client = await getClientByEmail(body.email);
    if (!client || !client.active || !verifyAccessCode(body.accessCode, client.access_code_hash)) {
      return NextResponse.json({ error: "Invalid email or access code" }, { status: 401 });
    }

    await createPortalSession(client.id);
    return NextResponse.json({ ok: true });
  }

  const formData = await request.formData();
  if (formData.get("action") === "logout") {
    await destroyPortalSession();
    return NextResponse.redirect(new URL("/portal/login", request.url));
  }

  return NextResponse.json({ error: "Unsupported request" }, { status: 400 });
}
