# Canonical state and recovered artifacts

**Audit date:** 2026-08-13

**Rule:** A local shortcut, installed PWA, prototype, branch or ZIP is evidence only until its role is explicitly classified here.

## Shared integration

| Item | Classification | Evidence |
|---|---|---|
| `main` at `2eb49f402eeb6497042e3dccffd59513ae551efc` | Current committed and deployed integration baseline at update time | PR #35 merge plus successful Cloudflare deployment run `31702587081` |
| PR #33 at `3640c12e0cafe6947440a4f603f998a49f4aa66a` | Public V5 release checkpoint | Merged PR and successful Cloudflare deployment |
| PR #34 at `da6630cdcba8ed2d44015ed1cea9af47bdc99971` | Contributor beta release checkpoint | Merged PR, successful deployment, live HTTP/browser verification |
| `checkpoint/two-product-contract-2026-08-13` | Canonical repository-contract tag | Resolves to `2eb49f4` |

## Public website

| Item | Classification | Evidence |
|---|---|---|
| Public V5 on `main` | Canonical deployed public runtime | PR #33; `website/app/page.tsx`, `website/app/public-site-v5.css`, `website/public/public-site-v5.js` |
| Public redesign V5 standalone folder | Historical approved visual reference | `D:\VERTICALMOMENT\WEBSITE\vertical-moment-redesign-preview-v5-final\vertical-moment-redesign-preview-v5-final` |
| Public redesign recovery master ZIP | Historical recovery instructions/evidence | SHA-256 `62DE7FAF2026545EDFBFCE5CB1483217EA90C3A393696F498FABA0D8DC745C94` |
| `vertical-moment-public-site-production-ready.zip` | Missing historical artifact | Do not fabricate or claim recovery; it no longer blocks the canonical PR #33 implementation |

The standalone folder's prototype service worker is reference-only and must never replace the production Serwist worker. Future logo, background, font and photography refinements must start from the canonical PR #33 runtime, not from a standalone prototype.

## Climbers Lounge / Explore PWA

| Item | Classification | Evidence |
|---|---|---|
| PRs #27-#32 on `main` | Merged PWA foundation and fixes | GitHub PR records |
| Contributor beta in PR #34 | Canonical deployed local-first beta | `/contribute` live with `noindex, nofollow`; device IndexedDB plus ZIP export; no remote queue/upload |
| `agent/explore-capabilities-2026-08-12` at `5fb71fe0249d51f8759273c5e2e903fe3c59cf72` | Active capability branch anchor | Separate protected checkout with EXP-02 review work |
| `checkpoint/pwa-capabilities-2026-08-12` | PWA/EXP-02 recovery tag | Resolves to `5fb71fe` |
| `agent/jammerwandl-source-glb` at `8f4b894953041b61d8c371b3f054551f4eec8195` | Preserved unmerged spatial workflow | Three commits after merged PR #6 add viewer, route-overlay and Blender-mask work |
| `checkpoint/jammerwandl-route-mask-workflow-2026-08-13` | Jammerwandl recovery tag | Resolves to `8f4b894` |
| EXP-02 Master ZIP | Focused review patch | SHA-256 `B2AE9255181463A9B6B401BB91AFE284F1FD96F660FB5EA9742180EEA9D3A77E` |
| Active EXP-02 working diff | Preserved uncommitted review state | Four files; diff object hash `761987c2bd82c946e538dc201f2e64d3e84628ab` during cleanup isolation |
| Brave "Explore Lab" and "Climbers Lounge" shortcuts | Installed versions of one product | Different app IDs/names; same `/explore-app` product family |

Installed browser state is useful for visual comparison but is not source code. Before replacing an installed version, capture its visible behavior, start URL, service-worker/cache state and build identifiers when available.

## Orchestration/stack evidence

The recovered low-cost model orchestration bundle is an operational reference, not application source code:

- `vertical-moment-free-model-orchestration-master-bundle-2026-08-13.zip`
- SHA-256 `B15250E17E45DBE0A9D486EEB1B68AA5335D44656B76CC84E6E76D884FCF115D`

Its software/model list was rechecked and normalized into `docs/operations/SOFTWARE_STACK.md`.

## Recovery rules

1. Preserve original files and checksums.
2. Label every artifact `canonical`, `approved reference`, `provisional`, `generated`, `historical` or `missing`.
3. Never silently promote a prototype or installed cache to canonical code.
4. Never overwrite the PWA while changing the public site, or vice versa.
5. Use isolated worktrees for recovery/migration.
6. Require tests, build and browser/device QA before commit/push/PR.
7. Keep publication and Cloudflare verification as separate approval gates.
