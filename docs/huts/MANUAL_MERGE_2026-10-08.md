# Personal hut planner review and manual merge

Repository: https://github.com/fstawiarski-ux/Vertical-Moment

Recorded base: db4e56fee38253e7a4d2ff082fb6ef6977524e58.
Local integration branch: shared/hut-planner-2026-10-08.

The owner requested an account-free personal tool with the same unlisted, direct-link approach as the existing planner. The final diff removes registration, sign-in, email setup, remote personal-data storage and server sharing. Browser saving, export/import and printing remain.

The older bundle and both earlier ZIP application versions are superseded. They contain the unwanted account implementation. Use the personal-tool source/patch or the eventual reviewed PR instead.

## Approval order

1. Prepare and validate the complete local integration diff against the recorded base.
2. Give the owner the PR title/body, results and storage/sharing explanation.
3. Wait for explicit permission to commit/push/create the PR.
4. Create and attach the PR after that permission.
5. The owner reviews and merges manually.

No PR creation, branch push, merge or deployment is authorized by preparing this local handoff. The root repository contract also preserves these gates.

The existing GitHub connection can create a PR without the owner sending passwords or secrets in chat. The hut tool requires no account credentials or email provider.

## Existing deployment behavior

The repository already deploys qualifying main-branch pushes through .github/workflows/deploy.yml. A manual merge can trigger that workflow. This revision does not alter the workflow or hosting credentials.

No remote database or secret is modified or removed. Unused resources from earlier setup are outside this code change; no cleanup is performed.

See BUILD_AND_RELEASE.md and PERSONAL_TOOL_VALIDATION_2026-10-08.md for local checks. The GitHub repository is currently public, while personal planner records remain browser-local and are excluded from all source patches.
