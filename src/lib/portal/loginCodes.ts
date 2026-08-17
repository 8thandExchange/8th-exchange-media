import crypto from "crypto";
import { Resend } from "resend";
import { getPortalDb } from "@/lib/portal/db";
import { getClientByEmail } from "@/lib/portal/service";
import { CONTACT_EMAIL } from "@/lib/site";

/**
 * Email one-time-code sign-in for portal clients.
 *
 * A client enters their email; if it matches an active client we email a
 * 6-digit code (scrypt-hashed at rest, 10-minute expiry, single use,
 * locked after 5 wrong attempts, max 3 codes per 15 minutes). The API
 * responds identically whether or not the email matched, so the endpoint
 * cannot be used to enumerate client emails.
 */

const CODE_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const MAX_CODES_PER_WINDOW = 3;
const ISSUE_WINDOW_MS = 15 * 60 * 1000;

function hashCode(code: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(code, salt, 32).toString("hex");
  return `${salt}:${hash}`;
}

function verifyHash(code: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = crypto.scryptSync(code, salt, 32).toString("hex");
  if (candidate.length !== hash.length) return false;
  return crypto.timingSafeEqual(Buffer.from(candidate), Buffer.from(hash));
}

export function generateLoginCode(): string {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
}

export function normalizeLoginCode(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  return digits.length === 6 ? digits : null;
}

/**
 * Issue and email a login code. Silently succeeds when the email matches
 * no active client (anti-enumeration) and when the rate limit is hit.
 *
 * Throws when the mailer is unconfigured — a client who is told to check
 * their inbox must never be told that about an email we couldn't send.
 */
export async function issueLoginCode(email: string): Promise<void> {
  // Checked before the client lookup so a missing key fails identically
  // for known and unknown emails — enumeration stays closed even when
  // the mailer is broken.
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured — cannot email login codes");
  }

  const client = await getClientByEmail(email);
  if (!client || !client.active) return;

  const db = getPortalDb();

  const windowStart = new Date(Date.now() - ISSUE_WINDOW_MS).toISOString();
  const { count, error: countError } = await db
    .from("portal_login_codes")
    .select("id", { count: "exact", head: true })
    .eq("client_id", client.id)
    .gte("created_at", windowStart);
  if (countError) throw new Error(countError.message);
  if ((count ?? 0) >= MAX_CODES_PER_WINDOW) return;

  const code = generateLoginCode();
  const { error } = await db.from("portal_login_codes").insert({
    client_id: client.id,
    code_hash: hashCode(code),
    expires_at: new Date(Date.now() + CODE_TTL_MS).toISOString(),
  });
  if (error) throw new Error(error.message);

  const resend = new Resend(apiKey);
  const from = process.env.CONTACT_FROM_EMAIL || "8th & Exchange Media <onboarding@resend.dev>";
  await resend.emails.send({
    from,
    to: [client.email],
    subject: `${code} is your 8th & Exchange sign-in code`,
    text: [
      `Hi ${client.contact_name.split(/\s+/)[0]},`,
      ``,
      `Your sign-in code for the 8th & Exchange client portal:`,
      ``,
      `    ${code}`,
      ``,
      `It expires in 10 minutes and works once. If you didn't request it,`,
      `you can ignore this email — nobody can sign in without it.`,
      ``,
      `— 8th & Exchange Media · ${CONTACT_EMAIL}`,
    ].join("\n"),
  });
}

/**
 * Verify a code for an email. Returns the client id on success, null on
 * any failure (wrong/expired/used code, unknown email, too many tries).
 */
export async function verifyLoginCode(email: string, rawCode: string): Promise<string | null> {
  const code = normalizeLoginCode(rawCode);
  if (!code) return null;

  const client = await getClientByEmail(email);
  if (!client || !client.active) return null;

  const db = getPortalDb();
  const { data: row, error } = await db
    .from("portal_login_codes")
    .select("id, code_hash, expires_at, consumed_at, attempts")
    .eq("client_id", client.id)
    .is("consumed_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!row) return null;

  if (new Date(row.expires_at).getTime() < Date.now()) return null;
  if (row.attempts >= MAX_ATTEMPTS) return null;

  if (!verifyHash(code, row.code_hash)) {
    await db
      .from("portal_login_codes")
      .update({ attempts: row.attempts + 1 })
      .eq("id", row.id);
    return null;
  }

  const { error: consumeError } = await db
    .from("portal_login_codes")
    .update({ consumed_at: new Date().toISOString() })
    .eq("id", row.id);
  if (consumeError) throw new Error(consumeError.message);

  return client.id;
}
