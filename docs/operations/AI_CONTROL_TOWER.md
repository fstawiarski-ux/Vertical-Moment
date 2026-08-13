# Vertical Moment AI control-tower review loop

This document defines the owner-gated workflow for bounded Vertical Moment work. It applies to repository operations, the public website, the Climbers Lounge / Explore PWA and shared foundations without making any product or publication decision on the owner's behalf.

## Authority and roles

- **Owner:** final decider. No commit, push, pull request, merge, deployment, deletion or external-service reconfiguration is implied by a task request.
- **ChatGPT Work / Codex:** user-facing control tower. It holds intent, verifies evidence, writes the bounded task packet, supervises implementation and performs the final implementation review.
- **Multica:** dispatch and audit plane. It records the issue, assignee, runs and reviewer feedback; it does not invent product direction.
- **Claude Code R1:** read-only pre-work contract reviewer. Claude checks whether the reviewed packet is safe and implementable before a worktree or scoped branch exists. Claude Code may have broader supervision or escalation uses elsewhere; this R1 role is specifically read-only.
- **Implementation worker:** one writer in one isolated worktree and scoped branch.
- **Codex R2:** post-implementation diff and test reviewer. A `PASS` prepares the result for owner acceptance; it does not authorize publication.

## Controlled flow

```text
Owner intent
  -> ChatGPT Work/Codex task packet
  -> Multica dispatch and audit record
  -> Claude R1 read-only contract review
       -> REVISE: answer every question and review again (maximum two rounds)
       -> BLOCKED: stop and return evidence/options to the owner
       -> READY: freeze the packet and request the owner worktree gate
  -> isolated worktree and scoped branch
  -> one implementation writer
  -> Codex R2 diff/test review
       -> FIX: one bounded repair round by the same writer
       -> ESCALATE: stop for owner direction
       -> PASS: owner acceptance review
  -> separate publication gate, only when explicitly approved
```

The R1 review asks, "Is this the correct and safe task to implement?" R2 asks, "Does this exact implementation satisfy the frozen task?" Neither review silently grants publication authority.

## Review decisions

Claude R1 must return one schema-valid verdict:

| Verdict | Meaning | Next action |
|---|---|---|
| `READY` | Packet is bounded, evidence-backed and implementable without guessing. | Freeze packet; request owner approval for the isolated worktree. |
| `REVISE` | Named questions or corrections can make the packet ready. | Answer every question, record the packet change and use no more than two total R1 rounds. |
| `BLOCKED` | Authority, state, safety or factual integrity prevents safe implementation. | Stop and return the evidence and options to the owner. |

An invalid or incomplete R1 response is never approval. It may be retried once with the required schema restated; a second invalid response stops the task.

Codex R2 must return one of:

- `PASS`: the isolated diff satisfies the frozen packet and is ready for owner acceptance;
- `FIX`: exact bounded repairs are required, with one repair round maximum;
- `ESCALATE`: scope, evidence or authority requires owner direction.

## Product and branch routing

Declare exactly one scope before editing:

| Scope | Branch prefix | Boundary |
|---|---|---|
| `public-site` | `site/<task>` | Photography, gallery, business/contact, public SEO and conversion. |
| `climbers-lounge-pwa` | `pwa/<task>` | Explore Lab, Atlas, routes, offline PWA, contributor intake and spatial tools. |
| `shared-data` | `shared/<task>` | Shared data, packages, synchronization and other explicitly cross-product foundations. |
| `repository-operations` | `shared/<task>` when the document governs both products or shared repository foundations | Governance, ownership, CI/repository documentation and operating contracts. |

Public-site work must not alter PWA behavior. PWA work must not redesign the public site. Shared changes require an explicit compatibility explanation for both products. Never invent climbing routes, access facts, grades, geometry or source-data authority.

## Worktree, context and validation boundaries

- Start from the current verified clean `main` base; do not reset or clean another checkout to match a handoff snapshot.
- Create the isolated worktree only after a valid R1 `READY` and explicit owner approval.
- Keep one writer per branch/worktree. Reviewers read and report; they do not modify the writer's output.
- Keep generated service workers, package manifests, lockfiles, deployment configuration, secrets, complete Atlas data, heavy source media and unrelated files out of a documentation or focused code patch unless separately approved.
- Before owner acceptance, inspect `git status --short --branch`, `git diff --check`, `git diff --name-only`, the full focused diff and the task-specific tests or manual checks.

## Publication and rollback

Owner acceptance of a local diff is separate from publication. Commit, push, pull request, merge and deploy are distinct explicit gates; deployment is never implied by merge.

Before commit, retain the isolated diff for review or remove only the explicitly created worktree after owner approval. After an approved commit or pull request, use a focused revert rather than rewriting `main`.
