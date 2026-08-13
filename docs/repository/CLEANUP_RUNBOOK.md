# Two-product repository cleanup runbook

This runbook is intentionally staged. Each destructive phase ends at a human review gate.

## Phase 0 - preserve active work (complete for this review)

- Preserve the active EXP-02 four-file diff and Master ZIP.
- Keep the active PWA checkout untouched.
- Create cleanup work in an isolated worktree/branch from clean `main`.
- Record public V5 prototype/recovery checksums and the historical missing production-patch status.
- Preserve PR #33 (Public V5) and PR #34 (contributor beta) as deployed integration anchors before rebasing the cleanup review.

## Phase 1 - merge the arrival layer

Review the root README, `AGENTS.md`, product map, ADR, stack inventory, recovery ledger, branch audit, file audit, CODEOWNERS and PR template.

Acceptance:

- future agents can identify the product in under one minute;
- every tool/model is status-labelled rather than assumed;
- public and PWA boundaries match owner intent;
- no runtime behavior, deployment or generated file changes;
- repository remains build-compatible.

After approval: commit, push and open a review PR. Merge only with explicit owner approval.

## Phase 2 - preserve milestones and remove merged branch clutter (complete)

After Phase 1 is on `main`:

1. re-fetch the remote;
2. confirm GitHub still reports no open PRs on cleanup candidates;
3. create approved checkpoint tags for the integration baseline and PWA capability anchor;
4. compare every remote tip with the exact head commit stored on its merged PR;
5. delete only exact merged tips and preserve any branch that advanced after merge;
6. verify the GitHub branch list and clone/fetch behavior afterward.

Completed result: 30 exact merged PR branch pointers were deleted. `agent/jammerwandl-source-glb` was retained because three valuable commits followed PR #6, and it received its own recovery checkpoint. The final three-branch state and all tag targets are recorded in `BRANCH_AUDIT_2026-08-13.md`.

## Phase 3 - stabilize both product baselines

### Public site

- Treat PR #33 as the canonical deployed Public V5 runtime.
- Restore the approved logo, background, fonts and photography only through focused `site/` work.
- Never reuse the prototype service worker or overwrite PWA/shared foundations.
- Capture mobile/desktop screenshots and full build results before and after visual refinements.

### PWA

- Review EXP-02 on a `pwa/` branch based on the active capability anchor.
- Compare local browser behavior with both installed-app versions.
- Validate tests, Next build, lazy Atlas chunking and relevant PWA/offline regressions.
- Preserve `/explore-app` privacy.
- Crash-test the PR #34 contributor beta on a phone with photo/GPX files; keep it local-only until remote intake, authentication, privacy and moderation are separately designed.

## Phase 4 - physical package separation

Only after both baselines are approved:

1. create `apps/public-site` without visual behavior changes;
2. create `apps/climbers-lounge-pwa` without PWA behavior changes;
3. extract `packages/brand`, `packages/climbing-data` and `packages/shared-media` only where reuse is genuine;
4. introduce path-scoped tests/builds;
5. introduce separate preview/deployment targets;
6. integrate the public site and PWA through an explicit link/router contract later.

Do not duplicate route databases, source media or brand masters across apps.

## Phase 5 - file/storage cleanup

- Audit root `index.html` against static references, then archive or remove it through a focused PR.
- Move heavy masters to verified external storage with checksums and restore tests.
- Keep only optimized/versioned delivery assets in the runtime path.
- Mark historical docs clearly and remove stale operational instructions.
- Re-run data validation, tests, full builds and a fresh clone/LFS checkout check.

## Rollback

- Documentation/guardrail PR: revert its single reviewed commit.
- Branch cleanup: recreate a deleted pointer from the merged PR/head SHA if necessary.
- Product migration: revert the focused migration PR; do not reset `main`.
- Asset migration: restore only from checksum-verified external masters.

## Final completion definition

Cleanup is complete only when both products have approved canonical code, separate product workspaces and deploy previews; all shared foundations are explicit; branch clutter is removed; heavy-asset recovery is tested; and the owner has reviewed the final GitHub layout.
