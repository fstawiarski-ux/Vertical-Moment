/**
 * R2 evidence storage — DORMANT in the beta (hosting.json has r2: null).
 *
 * Contributor originals are private and immutable once submitted (see
 * docs/GOVERNANCE.md from the earlier design). When you enable R2:
 *   1. Set "r2" to a binding name in .openai/hosting.json.
 *   2. vite.config.ts already wires the binding for local dev.
 *   3. Access the bucket from the worker request context and call putEvidence().
 *
 * Kept as a typed stub so nothing imports a live binding until you turn it on.
 */

export type EvidenceUpload = {
  submissionId: string;
  originalFilename: string;
  mimeType: string;
  body: ArrayBuffer | ReadableStream;
};

// Minimal shape of Cloudflare's R2 bucket binding we rely on.
type R2Like = { put: (key: string, body: ArrayBuffer | ReadableStream) => Promise<unknown> };

export async function putEvidence(bucket: R2Like, u: EvidenceUpload): Promise<string> {
  const safe = u.originalFilename.replace(/[^\w.\-]+/g, "_");
  const key = `contributor-originals/${u.submissionId}/${Date.now()}-${safe}`;
  await bucket.put(key, u.body);
  return key; // store this in submission_files.r2_key
}
