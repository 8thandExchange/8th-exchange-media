import { NextResponse } from "next/server";
import { createPortalSession, destroyPortalSession } from "@/lib/portal/auth";
import { issueLoginCode, verifyLoginCode } from "@/lib/portal/loginCodes";

/**
 * Portal sign-in: email one-time codes.
 *
 * request-code always answers { ok: true } for a well-formed email —
 * whether or not it matched a client — so the endpoint can't be used to
 * enumerate who our clients are. All the real limits (rate, expiry,
 * attempts, single use) live in lib/portal/loginCodes.
 */

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = (await request.json().catch(() => null)) as {
      action?: string;
      email?: string;
      code?: string;
    } | null;
    if (!body) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    if (body.action === "logout") {
      await destroyPortalSession();
      return NextResponse.json({ ok: true });
    }

    const email = body.email?.trim().toLowerCase() ?? "";
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
    }

    if (body.action === "request-code") {
      try {
        await issueLoginCode(email);
      } catch (error) {
        console.error("Login code issue failed", error);
        return NextResponse.json(
          { error: "We couldn't send a code just now — try again in a minute" },
          { status: 500 }
        );
      }
      return NextResponse.json({ ok: true });
    }

    if (body.action === "verify-code") {
      if (!body.code?.trim()) {
        return NextResponse.json({ error: "Enter the 6-digit code" }, { status: 400 });
      }
      const clientId = await verifyLoginCode(email, body.code);
      if (!clientId) {
        return NextResponse.json(
          { error: "That code didn't match — check it, or request a fresh one" },
          { status: 401 }
        );
      }
      await createPortalSession(clientId);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  }

  const formData = await request.formData();
  if (formData.get("action") === "logout") {
    await destroyPortalSession();
    return NextResponse.redirect(new URL("/portal/login", request.url));
  }

  return NextResponse.json({ error: "Unsupported request" }, { status: 400 });
}
