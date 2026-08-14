## Summary

Describe the outcome and why it is needed.

## Product scope

Select exactly one primary scope:

- [ ] Public website (`site/` branch)
- [ ] Climbers Lounge / Explore PWA (`pwa/` branch)
- [ ] Shared data/infrastructure (`shared/` branch with cross-product explanation)
- [ ] Repository operations/documentation

### Boundary check

- [ ] I read `AGENTS.md` and `docs/PRODUCT_MAP.md`.
- [ ] The branch/HEAD and starting working tree were recorded.
- [ ] Files belonging to the other product were not changed, or every cross-product change is explained below.
- [ ] Shared package/Cloudflare/OpenNext/Serwist/workflow effects are described when applicable.

Cross-product impact:

<!-- None, or explain compatibility and why shared scope is required. -->

## Authority and data boundary

- [ ] I am opening this PR for review only; no merge or deployment is implied by this PR.
- [ ] The canonical checkout and starting commit are recorded in the PR description.
- [ ] I identified the source of truth and regenerated any derived mirrors.
- [ ] No private GPX, raw source media, personal location, credential or unlicensed material is included.
- [ ] If GitHub, Cloudflare or another external setting changed, I recorded the before/after state separately.

Source of truth and external settings notes:

<!-- Include the canonical input, generated outputs, and any separately approved settings change. -->

## Changed files

<!-- List the focused source file set. Generated output should be identified separately. -->

## Evidence and verification

- [ ] Source references are linked or described.
- [ ] Uncertain fields are marked provisional.
- [ ] Structured data validates against its schema.
- [ ] No private, restricted, or unlicensed source material was added.
- [ ] Relevant tests passed.
- [ ] Relevant builds passed.
- [ ] Browser/device QA is attached or explicitly deferred.
- [ ] `git diff --check` passed.
- [ ] `website/public/sw.js` was not manually edited or included as source.

## Release status

- [ ] Review only — no deployment requested.
- [ ] Deployment requested separately and explicitly approved.

## Rollback or recovery

<!-- Name the revert commit, preserved source, feature flag, or other recovery path. -->

No PR author or agent should auto-merge this change. The owner reviews and merges manually.
