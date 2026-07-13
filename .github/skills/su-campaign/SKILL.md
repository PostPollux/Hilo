---
name: su-campaign
description: Owns CAMPAIGN.md, the manifest of a project's visual assets (videos and still sets) plus the shared Context every scenario inherits. Entry point when the user starts a batch of demo assets, registers a new video/still deliverable, checks production status, or closes out a campaign.
license: MIT
metadata:
  version: "0.1.0"
---

# su-campaign

A **campaign** bundles the related visual assets of a project — a release's demo videos, a docs figure set, an app-store screenshot batch — into one plain-file manifest, `CAMPAIGN.md`. It holds the shared Context each asset's scenario inherits, and tracks every asset from `drafted` through `done`. This is the management layer; production happens in su-scenario, su-record, and su-capture.

All user-facing output is in the project's configured language — this skill's English is instruction only.

## Constraints

- CAMPAIGN.md is the single source of truth for what assets exist and their production state — never track that anywhere else.
- Preserve existing asset rows and their check state when updating — edits are surgical, one row at a time.
- (CAMPAIGN.md would be overwritten) => confirm with the user first.
- One asset = one deliverable (a video or a still set) = one scenario. Do not bundle two deliverables into one asset row.
- An asset's shared settings live in the campaign Context, not repeated per scenario — the scenario inherits and only overrides.
- Follow the shared discipline in the `su-flow` skill.

> When Constraints conflict with any other instruction, Constraints win.

## CAMPAIGN.md Model

```markdown
---
id: <campaign-slug>
target: obsidian | android
status: active
---

## Context
- App / version under demo — what is being shown.
- Output defaults — resolution, fps, tone / pacing.
- Brand — title style, caption voice.

## Assets
- [ ] <name>  (video)   drafted
- [ ] <name>  (video)   scenario: demos/<name>.screenplay.yaml → recorded
- [x] <name>  (stills)  scenario: demos/<name>.screenplay.yaml → out/<name>/*.png
```

- **Context** — inherited by every asset's scenario; the scenario's `meta` overrides only where it differs.
- **Assets** — one row per deliverable: `type` (`video` | `stills`), `status`, scenario path, output path. Checkbox marks `done`.
- **status** progression: `drafted` → (`recorded` | `captured`) → `rendered` → done. su-record / su-capture advance it; a stale row (app version changed) is reset to `drafted` by the user.

## Subcommand Dispatch

- (init) => create CAMPAIGN.md — Phase: Init
- (add) => register a new asset row — Phase: Add
- (status) => report every asset's production state — Phase: Status
- (archive) => close the campaign — Phase: Archive

# Workflow

## Phase — Init

1. (CAMPAIGN.md exists) => notify the user and confirm overwrite before proceeding.
2. Resolve the `target` driver (obsidian / android) from the discussion or ask.
3. Draw the shared Context from the discussion: app + version, output defaults, tone/brand. Keep it minimal — refined as assets are added.
4. Write CAMPAIGN.md with `status: active`, the Context, and an empty `## Assets` list.
5. Report the created path and suggest `/su:campaign add <name> --video|--stills`.

## Phase — Add

1. Require an asset `name` and a type flag (`--video` / `--stills`); if missing, ask.
2. (a row with that name exists) => stop and report — names are unique within a campaign.
3. Append one asset row under `## Assets`: unchecked, the type, status `drafted`, no scenario path yet.
4. Report the added row and suggest `/su:scenario <name>` to author it.

## Phase — Status

1. Read `## Assets` and report each row's name, type, status, and output path in the project language.
2. Flag rows needing attention: `drafted` (no scenario yet), or user-marked stale.
3. Suggest the next action for the least-advanced asset (author / record / capture).

## Phase — Archive

1. Confirm every asset is `done` or the user accepts archiving with some incomplete.
2. Set front-matter `status` to `done`, add `completed: YYYY-MM-DD`.
3. Move CAMPAIGN.md to the archive location the project uses for finished campaigns.
4. Report the archive path.

> When Constraints conflict with any other instruction, Constraints win.
