import { describe, expect, it } from "vitest";
import {
  checklistProgress,
  itemRequired,
  itemVisible,
  isValidClientType,
  visibleChecklist,
  type ClientType,
} from "@/lib/portal/checklist";
import { decryptSecret, encryptSecret, isEncryptedSecret, maskSecret } from "@/lib/portal/crypto";
import { isComplianceAnswered } from "@/lib/portal/types";

describe("client type", () => {
  it("accepts the three modes and rejects anything else", () => {
    expect(isValidClientType("local")).toBe(true);
    expect(isValidClientType("platform")).toBe(true);
    expect(isValidClientType("b2b")).toBe(true);
    expect(isValidClientType("consumer")).toBe(false);
  });
});

describe("checklist modes", () => {
  it("keeps GBP visible for every mode but required only for local", () => {
    expect(itemVisible({ key: "google-business-profile", label: "", help: "", optionalFor: ["platform", "b2b"] }, "local")).toBe(true);
    expect(itemRequired({ key: "google-business-profile", label: "", help: "", optionalFor: ["platform", "b2b"] }, "local")).toBe(true);
    expect(itemRequired({ key: "google-business-profile", label: "", help: "", optionalFor: ["platform", "b2b"] }, "platform")).toBe(false);
    expect(itemRequired({ key: "google-business-profile", label: "", help: "", optionalFor: ["platform", "b2b"] }, "b2b")).toBe(false);
  });

  it("makes LinkedIn required for platform and B2B, optional for local", () => {
    const linkedin = { key: "linkedin-page", label: "", help: "", optionalFor: ["local"] as ClientType[] };
    expect(itemRequired(linkedin, "local")).toBe(false);
    expect(itemRequired(linkedin, "platform")).toBe(true);
    expect(itemRequired(linkedin, "b2b")).toBe(true);
  });

  it("treats TikTok as optional everywhere", () => {
    const tiktok = { key: "tiktok-business", label: "", help: "", optional: true };
    expect(itemRequired(tiktok, "local")).toBe(false);
    expect(itemRequired(tiktok, "platform")).toBe(false);
  });

  it("renders fewer required items for a platform than a local shop", () => {
    const local = checklistProgress({}, "local");
    const platform = checklistProgress({}, "platform");
    expect(local.requiredTotal).toBeGreaterThan(platform.requiredTotal);
    expect(platform.requiredTotal).toBeGreaterThan(0);
    expect(visibleChecklist("platform").some((g) => g.items.some((i) => i.key === "google-business-profile"))).toBe(true);
  });

  it("weights required items three times optional ones", () => {
    const progress = checklistProgress(
      {
        "google-analytics": { done: true },
        "tiktok-business": { done: true },
      },
      "platform"
    );
    expect(progress.requiredDone).toBe(1);
    expect(progress.optionalDone).toBe(1);
    expect(progress.weightedDone).toBe(4);
    expect(progress.percent).toBeGreaterThan(0);
    expect(progress.percent).toBeLessThan(100);
  });
});

describe("compliance gate", () => {
  it("stays locked until BAA status and PHI flag are both set", () => {
    expect(
      isComplianceAnswered({ baa_status: null, phi_permitted: null, compliance_answered_at: null })
    ).toBe(false);
    expect(
      isComplianceAnswered({
        baa_status: "pending",
        phi_permitted: false,
        compliance_answered_at: null,
      })
    ).toBe(false);
    expect(
      isComplianceAnswered({
        baa_status: "pending",
        phi_permitted: false,
        compliance_answered_at: "2026-08-23T00:00:00.000Z",
      })
    ).toBe(true);
  });
});

describe("PIT encryption", () => {
  it("round-trips, prefixes ciphertext, and masks the last four", () => {
    const plain = "pit-abcdefghijklmnopqrstuvwxyz";
    const stored = encryptSecret(plain);
    expect(isEncryptedSecret(stored)).toBe(true);
    expect(stored).not.toContain(plain);
    expect(decryptSecret(stored)).toBe(plain);
    expect(maskSecret(plain)).toBe("••••wxyz");
  });

  it("passes legacy plaintext through decrypt unchanged", () => {
    expect(decryptSecret("pit-legacy-plain")).toBe("pit-legacy-plain");
    expect(isEncryptedSecret("pit-legacy-plain")).toBe(false);
  });
});
