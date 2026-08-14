# Repository roles and permissions

This document answers “who may do what?” It is intentionally small and operational. GitHub permissions, branch protection and CODEOWNERS must agree with it.

## Role matrix

| Role | Current assignment | May review | May merge `main` | May deploy | May change canonical data | May change GitHub settings |
|---|---|---:|---:|---:|---:|---:|
| Repository owner / release approver | `fstawiarski-ux` | Yes | Yes, after required checks | Yes | Yes, with evidence | Yes |
| Product maintainer | Not assigned | Yes for its product | Only when granted by owner | No by default | Only through reviewed PR | No |
| Data steward | Not assigned | Data PRs | No by default | No | Yes through canonical-data PRs | No |
| Technical reviewer | Not assigned | Yes | Only when required by rules | No | No | No |
| AI agent / automation | Temporary, task-scoped | No approval authority | No | No | No silent promotion | No |

At present, the repository owner is also the only collaborator and CODEOWNERS entry. A second reviewer can be added later with the least privilege needed: `Write` for contributors, `Maintain` for maintainers, and `Admin` only for the owner or a deliberately appointed administrator.

## Non-negotiable boundaries

- No direct push to `main` for normal work.
- No merge without the required PR checks.
- No deployment from a feature branch.
- No agent may approve its own work or silently change GitHub access.
- No source workbook, Notion export, OCR result or field report becomes canonical without reconciliation evidence.
- No GPX, raw media master or private evidence goes under `website/public/`.
- Secrets belong in GitHub/Cloudflare secret storage, never in the repository or handoff bundle.

## Ownership map

`.github/CODEOWNERS` is the path-level ownership map. Changes under these areas currently route to the repository owner:

- `website/`: runtime, public site and PWA
- `website/src/` and `website/app/explore-app/`: Explore implementation
- `database/`: canonical and generated data
- `products/`, `docs/`, `areas/`, `models/`: product and production contracts

When a second maintainer is appointed, update CODEOWNERS and this file in the same PR. Do not create an implied role by editing only one of them.

## Review expectations

Every PR should state:

1. scope and user-facing impact;
2. exact source-of-truth changes;
3. security or privacy impact;
4. tests and live/local evidence;
5. rollback or recovery path.

Repository-operations PRs also require a settings snapshot before and after the change. External settings changes are never hidden inside an unrelated product PR.

## Escalation

- Data disagreement: stop publication and ask the data steward/release approver.
- Rights or privacy uncertainty: keep the asset private and ask the release approver.
- CI or deployment uncertainty: stop the release and use the release runbook.
- Suspicious credential or exposure: rotate/revoke through the provider first, then document the incident.
