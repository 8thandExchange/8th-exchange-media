import { cookies } from "next/headers";
import crypto from "crypto";

const SESSION_COOKIE = "8e_portal_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;

function getSessionSecret(): string {
  return (
    process.env.PORTAL_SESSION_SECRET ??
    process.env.INVOICING_SESSION_SECRET ??
    process.env.STRIPE_SECRET_KEY ??
    "development-portal-secret"
  );
}

function signToken(payload: string): string {
  const signature = crypto
    .createHmac("sha256", getSessionSecret())
    .update(payload)
    .digest("hex");
  return `${payload}.${signature}`;
}

function verifyToken(token: string): string | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = crypto
    .createHmac("sha256", getSessionSecret())
    .update(payload)
    .digest("hex");

  if (signature.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  return payload;
}

/** Human-friendly access code, e.g. "K3NF-Q7XT-2MHB" (no 0/O/1/I). */
export function generateAccessCode(): string {
  const alphabet = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
  const pick = () => alphabet[crypto.randomInt(alphabet.length)];
  const group = () => Array.from({ length: 4 }, pick).join("");
  return `${group()}-${group()}-${group()}`;
}

export function hashAccessCode(code: string): string {
  const normalized = code.trim().toUpperCase();
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(normalized, salt, 32).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyAccessCode(code: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const normalized = code.trim().toUpperCase();
  const candidate = crypto.scryptSync(normalized, salt, 32).toString("hex");
  if (candidate.length !== hash.length) return false;
  return crypto.timingSafeEqual(Buffer.from(candidate), Buffer.from(hash));
}

export async function createPortalSession(clientId: string): Promise<void> {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const payload = Buffer.from(JSON.stringify({ cid: clientId, exp: expiresAt })).toString(
    "base64url"
  );
  const token = signToken(payload);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function destroyPortalSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

/** Returns the logged-in portal client's id, or null. */
export async function getPortalClientId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      cid?: string;
      exp?: number;
    };
    if (typeof data.exp !== "number" || data.exp <= Date.now()) return null;
    return typeof data.cid === "string" ? data.cid : null;
  } catch {
    return null;
  }
}

export async function requirePortalClient(): Promise<string> {
  const clientId = await getPortalClientId();
  if (!clientId) {
    throw new Error("Unauthorized");
  }
  return clientId;
}
