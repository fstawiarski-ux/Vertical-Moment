/**
 * Phase 2 stub: no auth yet, so every viewer is anonymous. Map, Explore and
 * Contribute all already treat a null viewer as valid — this file is the one
 * place Phase 3 swaps out for a real Auth.js (email magic link) session.
 */
export async function getViewer() {
  return { email: null, name: null, display: null as string | null };
}
