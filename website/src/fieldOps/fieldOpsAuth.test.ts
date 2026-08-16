import { describe, expect, it } from "vitest";
import { constantTimeStringEqual, fieldOpsAccessMatches, fieldOpsSecretIsConfigured, fieldOpsSessionToken } from "./fieldOpsAuth";

describe("Field Ops authentication helpers", () => {
  it("requires a strong-enough configured secret", () => {
    expect(fieldOpsSecretIsConfigured("short")).toBe(false);
    expect(fieldOpsSecretIsConfigured("012345678901234567890123")).toBe(true);
  });

  it("derives stable session tokens without returning the source secret", async () => {
    const secret = "012345678901234567890123456789ab";
    const first = await fieldOpsSessionToken(secret);
    const second = await fieldOpsSessionToken(secret);
    expect(first).toBe(second);
    expect(first).not.toContain(secret);
    expect(first).toMatch(/^[a-f0-9]{64}$/);
  });

  it("accepts only the exact access key", async () => {
    const secret = "012345678901234567890123456789ab";
    await expect(fieldOpsAccessMatches(secret, secret)).resolves.toBe(true);
    await expect(fieldOpsAccessMatches(`${secret}x`, secret)).resolves.toBe(false);
    expect(constantTimeStringEqual("abc", "abc")).toBe(true);
    expect(constantTimeStringEqual("abc", "abd")).toBe(false);
  });
});
