# Security baseline

This is the practical baseline for the beta repository. It is not a penetration test or a legal rights audit.

## Enforced controls

- `main` requires reviewed pull-request flow and required checks.
- GitHub Actions is restricted to approved action sources and pinned revisions.
- Workflow default token permissions are read-only.
- Secret scanning and push protection are enabled.
- Dependabot security updates are enabled.
- Public responses include baseline transport, framing, referrer, content-type and permissions headers.
- `/review-preview` remains a local-development surface. `/explore-app` is a private-by-link, noindex PWA surface with no public navigation; an unlisted URL is not authentication.
- GPX and other unverified approach files are kept outside the public runtime.
- Canonical data and the website mirror are verified in CI.
- CI verifies that public GPX files, public GPX URLs and unpinned repository actions do not reappear.

## Current exclusions and follow-ups

- A full Content Security Policy still needs a dependency inventory for Leaflet, fonts and media before enforcement.
- Public media rights and source attribution require owner review per asset family.
- Contribution/report storage is local-first; no server upload or account boundary exists yet.
- Dependency updates should be reviewed rather than applied blindly, especially around Wrangler/OpenNext/Miniflare.
- Live checks after every merge are required; passing CI alone does not prove the deployed site is correct.

## Incident rule

If a private file, token or personal location is exposed, stop publication, preserve evidence, revoke or rotate the affected credential/URL, then open a focused remediation PR. Do not hide the incident by rewriting history.
