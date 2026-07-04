# Release-branch deploy trigger

## Problem

Production deploy (`deploy.yaml`) currently triggers on the `release: published`
GitHub event, which only fires after `release-please` successfully creates a
GitHub Release. That chain has several links (release-please-action →
GitHub API → Release object → `release` event → `deploy.yaml`), and it just
broke once already (bad `app-id` secret caused `create-github-app-token` to
fail, so no Release was ever created, so no deploy ever fired — silently).

We want a trigger with fewer moving parts, and a manual escape hatch that
doesn't depend on release-please working at all.

## Design

Keep `release-please` doing what it's good at (version bump, `CHANGELOG.md`,
opening the release PR). Add a `release` branch as the deploy trigger:

1. **`release-please.yaml`** — after the existing `release-please-action`
   step, add a step gated on `steps.release-please.outputs.release_created`
   that checks out `main` and does `git push origin HEAD:release`. This
   fast-forwards `release` to match `main` (or creates it, the first time).
   A plain push, not a force push — if `release` has diverged (e.g. someone
   pushed a hotfix directly to it), this step fails loudly instead of
   clobbering it.
2. **`deploy.yaml`** — change the trigger from `release: published` to
   `push: branches: [release]`. Keep `workflow_dispatch` as a manual
   fallback.

Net effect: merging a release-please PR still auto-deploys, same as today.
But the trigger is now a plain git push, and maintainers can also push or
merge directly into `release` for a hotfix deploy without touching
release-please at all.

## Data flow

```
push to main
  -> release-please.yaml runs
     -> release-please-action opens/updates release PR
     -> (on merge of that PR) release-please-action creates GH Release + tag
        -> release_created=true
        -> fast-forward step pushes main -> release
           -> deploy.yaml triggers on push to release
              -> build + deploy to GitHub Pages
```

Manual hotfix path: push/merge directly to `release` -> `deploy.yaml` triggers
directly, bypassing release-please.

## Error handling

- If the fast-forward push is not a fast-forward (branch diverged), the step
  fails and the job shows red. The release-please release itself has already
  been created by that point, so this failure only affects the deploy
  trigger, not versioning. A maintainer resolves by fast-forwarding or
  resetting `release` manually.
- `workflow_dispatch` remains available on `deploy.yaml` for manual redeploys
  regardless of branch state.

## Testing / rollout

- No automated tests for GitHub Actions workflows in this repo; verification
  is manual.
- After merging, verify by: (1) triggering `deploy.yaml` manually via
  `workflow_dispatch` to confirm the push-to-release path still deploys
  correctly, (2) creating the `release` branch for the first time (push step
  will create it since it doesn't exist yet), (3) watching the next
  release-please PR merge auto-deploy end to end.

## Out of scope

- Not changing how release-please determines versions/changelog content.
- Not adding branch protection rules on `release` (can be added later if
  direct pushes need restricting).
