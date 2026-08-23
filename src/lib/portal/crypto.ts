import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import "server-only";

/**
 * AES-256-GCM for GHL Private Integration tokens.
 * Ciphertext is prefixed so legacy plaintext rows still decrypt as a no-op.
 * Key is derived from PORTAL_TOKEN_SECRET, then the usual session-secret chain.
 */
const PREFIX = "enc:v1:";

function getTokenKey(): Buffer {
  const secret =
    process.env.PORTAL_TOKEN_SECRET ??
    process.env.PORTAL_SESSION_SECRET ??
    process.env.INVOICING_SESSION_SECRET ??
    process.env.STRIPE_SECRET_KEY ??
    "development-ghl-token-secret";
  return createHash("sha256").update(secret).digest();
}

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getTokenKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return PREFIX + Buffer.concat([iv, tag, enc]).toString("base64");
}

export function decryptSecret(stored: string): string {
  if (!stored.startsWith(PREFIX)) return stored;
  const buf = Buffer.from(stored.slice(PREFIX.length), "base64");
  if (buf.length < 28) throw new Error("Corrupt encrypted secret");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const data = buf.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", getTokenKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

export function isEncryptedSecret(stored: string): boolean {
  return stored.startsWith(PREFIX);
}

export function maskSecret(plain: string): string {
  const last = plain.replace(/\s/g, "").slice(-4);
  return last ? `••••${last}` : "••••";
}

export function secretLast4(plain: string): string {
  return plain.replace(/\s/g, "").slice(-4);
}
