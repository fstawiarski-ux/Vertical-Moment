# Private Preview / Release Checklist

Date: 2026-08-19

Scope: `climbers-lounge-pwa`
State: **Private beta approved for GitHub integration; provenance remains provisional**

## Preview decision

- [x] Helenental regional prototype runs locally with Beethovenwand selected.
- [x] Wachau regional prototype runs locally with Däumling selected.
- [x] Borrowed motion is visibly labelled `LOCAL PROXY` and not verified for the selected pilot.
- [x] Pilot release slots remain `status: missing` with `src: null` when pilot-specific media is not approved.
- [x] The preview adapter is replaceable and accepts same-origin or approved HTTPS media.
- [x] The permanent Region -> Rock -> Sector -> Topo journey and five-box product contract remain intact.
- [x] Missing hero, topo, panorama and web-model assets fail closed as awaiting upload.
- [x] Both preview routes return HTTP 200 and runtime HTML contains `noindex`.
- [x] No browser warnings or errors were recorded in the automated desktop pass.
- [x] Owner reviewed the two local previews and accepted the interaction direction as an incomplete private beta.

## Evidence still pending

Do not promote owner-reported footage to verified until the corresponding row is complete.

| Target | Exact source path | SHA-256 | Owner | Private/public permissions | In/out timecodes | Desktop/tablet/phone crop | Poster | Visual wall confirmation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Beethovenwand motion | Pending | Pending | Pending | Pending | Pending | Pending | Pending | Pending |
| Helenental node clips | Pending where unresolved | Pending where unresolved | Pending | Pending | Pending | Pending | Pending | Pending |
| Däumling / Dürnstein motion | Pending | Pending | Pending | Pending | Pending | Pending | Pending | Pending |
| Beethovenwand web model derivative | Source GLB and texture known; derivative path pending | Source hashes known; derivative hash pending | Pending | Optimization/copy/publication pending | N/A | N/A | Pending | Model identity known; derivative QA pending |

Nasenwand proxy files have local paths and hashes in the Beethovenwand private intake/readiness report. Those facts identify the proxy only; they do not verify Helenental, Beethovenwand or Däumling footage.

## Adapter replacement contract

1. Keep the real asset slot `status: missing` and `src: null` while evidence is incomplete.
2. Use `preview.adapter`, `preview.src`, `preview.provenance`, `verifiedForPilot: false` and `replaceable: true` only for the private/local experience.
3. When an approved derivative or hosted URL is available, attach its source evidence and QA first.
4. Replace or remove the preview adapter, set the release asset `src` to the approved same-origin/HTTPS URL, and set `status: ready` only after the asset passes the publication gate.
5. Rerun schema, manifest, playback, responsive, reduced-motion, offline and weak-signal validation after replacement.

## Private-preview validation

- [x] `npm run verify-pilots`
- [x] `npm test`
- [x] TypeScript check
- [x] `npm run verify-canonical`
- [x] `npm run verify-data`
- [x] `npm run verify-pwa-content`
- [x] `npm run verify-security`
- [x] `npm run build`
- [x] Helenental node switching and scroll-scrub playback
- [x] Wachau Däumling/Nasenwand provenance-state switching
- [ ] Physical phone and tablet touch/drag
- [ ] Conclusive responsive breakpoint capture
- [ ] Reduced-motion interaction QA
- [ ] Fresh-origin install and cache-clear offline QA
- [ ] Weak-signal media QA

## GitHub beta integration gate

- [ ] Resolve every pending evidence cell above.
- [ ] Replace all non-matching proxy media intended for release.
- [ ] Reconcile any unresolved route-count, identity and geometry claims.
- [x] Owner approval for beta GitHub integration received in the current Codex task.
- [x] Commit authorized.
- [x] Push authorized.
- [x] PR authorized.
- [x] Squash merge authorized.
- [ ] Deploy only with explicit owner authorization.
- [ ] Verify live cache headers, `robots`, manifests, playback and rollback.
- [ ] Remove `noindex` only under a separate explicit public-release decision.

At checklist capture the implementation is `LOCAL`; the owner has authorized progression through `MERGED`. The final handoff must report the actual achieved state. Deployment, live verification and removal of `noindex` remain separate gates.

## Exact next owner decision

After the squash merge and main-branch validation, choose the next two prepared regions for the same evidence-gated beta workflow. This approval does **not** verify footage identity, authorize model derivative work, authorize removal of `noindex`, or convert pending evidence into release-ready media.
