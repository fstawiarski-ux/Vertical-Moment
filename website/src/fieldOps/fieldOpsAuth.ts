export const FIELD_OPS_COOKIE = "vm_field_ops";
export const FIELD_OPS_MIN_SECRET_LENGTH = 24;

export function fieldOpsSecretIsConfigured(secret: string | undefined | null): secret is string {
  return typeof secret === "string" && secret.trim().length >= FIELD_OPS_MIN_SECRET_LENGTH;
}

async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function constantTimeStringEqual(left: string, right: string): boolean {
  const max = Math.max(left.length, right.length);
  let mismatch = left.length ^ right.length;
  for (let index = 0; index < max; index += 1) {
    mismatch |= (left.charCodeAt(index) || 0) ^ (right.charCodeAt(index) || 0);
  }
  return mismatch === 0;
}

export async function fieldOpsSessionToken(secret: string): Promise<string> {
  return sha256Hex(`vertical-moment-field-ops-v1:${secret}`);
}

export async function fieldOpsAccessMatches(accessKey: string, secret: string): Promise<boolean> {
  if (!fieldOpsSecretIsConfigured(secret) || !accessKey) return false;
  const [candidate, expected] = await Promise.all([sha256Hex(accessKey), sha256Hex(secret)]);
  return constantTimeStringEqual(candidate, expected);
}
