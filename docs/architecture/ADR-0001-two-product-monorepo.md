# ADR-0001: Separate products by workspace, not permanent branches

**Status:** Accepted; implementation staged

**Date:** 2026-08-13

**Decider:** Vertical Moment owner

## Context

Vertical Moment contains two products that currently compile and deploy from one Next.js package: a public photography/business website and the Climbers Lounge/Explore installable PWA. Historical feature branches, two installed PWA names and mixed route ownership have caused agents to confuse versions and product scope.

The products share brand, climbing data, media, Cloudflare/OpenNext tooling and a future integration path. The public V5 redesign is now live through PR #33. The PWA has a separate active capability branch/review patch, while the local-first contributor beta is live through PR #34.

## Decision

Use one canonical `main` branch and separate the products through explicit workspaces, product documentation, ownership maps, scoped agent rules and product-prefixed short-lived branches.

The current `website/` package remains transitional until visual and behavior baselines for both live products are approved. Runtime code will then migrate toward `apps/public-site` and `apps/climbers-lounge-pwa`, with genuinely shared foundations under `packages/`.

## Options considered

### Option A: Two permanent product branches

| Dimension | Assessment |
|---|---|
| Initial complexity | Low |
| Long-term drift risk | High |
| Shared-data safety | Poor |
| Future integration | Expensive |
| Agent clarity | Superficially clear, operationally fragile |

**Pros:** Immediate visual separation in GitHub branch names.

**Cons:** Shared fixes diverge, branch merges become product integration events, and GitHub still exposes only one default README to arriving agents.

### Option B: One monorepo with product workspaces — chosen

| Dimension | Assessment |
|---|---|
| Initial complexity | Medium |
| Long-term drift risk | Low |
| Shared-data safety | Strong |
| Future integration | Straightforward |
| Agent clarity | Strong with root and folder contracts |

**Pros:** One source of truth, path-scoped CI/ownership, explicit shared packages and simple cross-product review.

**Cons:** Requires a staged package migration and careful shared-infrastructure rules.

### Option C: Two repositories

| Dimension | Assessment |
|---|---|
| Isolation | Strongest |
| Shared-data overhead | High |
| Future integration | Medium/high |
| Operational overhead | High |

**Pros:** Hard access and deployment separation.

**Cons:** Duplicates or versions shared brand/data/media and adds synchronization work before the product boundaries are stable.

## Consequences

- `main` remains the canonical integration branch.
- New task branches use `site/`, `pwa/` or explicitly approved `shared/` prefixes.
- The root README and `AGENTS.md` route every arriving human/agent.
- Shared infrastructure changes must explain effects on both products.
- Old merged PR branches can be removed after review without losing product history.
- Code movement waits for canonical visual baselines; documentation and guardrails do not.

## Action items

1. [x] Create product map and product entry documents.
2. [x] Create root and runtime agent contracts.
3. [x] Record canonical/recovery artifacts and software stack.
4. [ ] Review and merge the documentation/guardrail change.
5. [ ] Tag preservation anchors and delete approved merged PR branches.
6. [x] Ship the approved public V5 direction on `site/` through PR #33.
7. [x] Launch the unlisted local-first contributor beta through PR #34.
8. [ ] Finish/review EXP-02 on `pwa/`.
9. [ ] Capture visual and behavior baselines for both products.
10. [ ] Migrate runtime packages in behavior-preserving stages.
11. [ ] Split CI/deployment targets after package boundaries exist.
