# GitHub integration guide

The implementation is pushed as a review branch only. The project owner retains pull-request creation, approval, merge, deployment, and domain-cutover control.

## Observed repository condition

The original local checkout was on `feature/photography-home-themes` with uncommitted photography changes. Those files were treated as user-owned and were not edited, staged, stashed, or switched.

The Nasenwand work was created in a separate worktree from current `origin/main` (`e16613e`), which already contains the merged photography homepage.

## Review branch

- Branch: `agent/nasenwand-concepts`
- Base: `main`
- Compare: <https://github.com/fstawiarski-ux/Vertical-Moment/compare/main...agent/nasenwand-concepts?expand=1>
- Pull request: intentionally not created

## Validate locally

```powershell
Set-Location "<your Vertical-Moment checkout>\website"
npm.cmd ci
npm.cmd run build
npm.cmd run dev
```

Review `/nasenwand-concepts` on phone and desktop sizes and complete `docs/nasenwand-concepts/TESTING_CHECKLIST.md`.

Then inspect the repository diff:

```powershell
Set-Location "<your Vertical-Moment checkout>"
git status --short
git diff --check
git diff main...agent/nasenwand-concepts -- website/app/nasenwand-concepts website/app/components/nasenwand website/app/data/nasenwand-concepts.ts
```

## Create the pull request manually

Use the comparison link above and select **Create pull request** only when ready. Suggested title:

```text
Website: add Nasenwand flagship media and spatial gallery
```

Suggested PR description points:

- adds only 01 Split Reveal, 02 Geological Wipe, and 06 Cinematic;
- adds seven selectable media modes from the supplied DJI production bundle;
- replaces oversized public masters with checksum-recorded production derivatives below 25 MiB;
- preserves shared framing, filter, progress, route-draw, pointer, and drag controls;
- adds a standalone no-index route and connects the homepage 3D Lab CTA;
- uses optimized derivatives from real Nasenwand sources;
- includes only a lightweight route prototype, not the full wall scan;
- keeps route/topo content provisional pending review;
- stores prototype model references outside the Worker public bundle;
- does not deploy, merge, change DNS records, or cut over production.

After merge, use the existing Cloudflare deployment workflow. Attach `verticalmoment.com` only after the deployed Worker route passes the same mobile/desktop checks.
