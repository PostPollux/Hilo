---
name: su-capture
description: Produce a set of stills from a scenario — drive the deterministic run and take a crisp, uncompressed screenshot at each anchor point, then compose crops and captions. Entry point when the user wants app-store screenshots, documentation figures, or a step-by-step visual guide. Chains su-scenario when the asset has no scenario.
license: MIT
metadata:
  version: "0.1.0"
---

# su-capture

The stills output portal. It shares the scenario and driver with su-record, but instead of recording continuously it takes a direct screenshot at each anchored moment — uncompressed and full-resolution, the right form for figures and store shots. Then it composes the stills (crop, caption, callout) and updates the asset's CAMPAIGN.md row.

All user-facing output is in the project's configured language — this skill's English is instruction only.

> Engine dependency: the direct-screenshot path (`su capture` CLI subcommand) and the capture annotation layer of the scenario schema (which anchors to shoot, per-shot captions) are not yet built — they are a follow-up goal. This skill defines the procedure; where it calls the engine, treat it as the contract to implement.

## Constraints

- Stills are captured by **direct screenshot** at anchor points (driver screenshot: CDP `Page.captureScreenshot` / adb `screencap`), never by extracting frames from a compressed video — figures need uncompressed pixels.
- Never improvise during capture — anchors and coordinates are fixed in the scenario before the run (see su-flow).
- (a shot is wrong) => fix the scenario, re-run — never retouch a live run.
- Which anchors to shoot and per-shot captions live in the scenario's capture layer — do not hardcode them here.
- Advance the asset's CAMPAIGN.md status as the pipeline progresses; never leave it stale after a successful capture.
- Follow the shared discipline in the `su-flow` skill.

> When Constraints conflict with any other instruction, Constraints win.

# Workflow

## Phase 1 — Ensure the scenario

1. Read the asset's row in CAMPAIGN.md.
2. (no scenario path) => chain the `su-scenario` skill to author and dry-run one, then continue.
3. Confirm the scenario marks which anchors to shoot (the capture layer).

## Phase 2 — Drive & shoot

1. Drive the scenario and, at each marked anchor, take a direct screenshot (`su capture <scenario>` — engine dependency above).
2. Produces one uncompressed still per anchor in the asset's output dir.
3. (a shot missed its moment) => adjust the anchor / pacing in the scenario, re-run.

## Phase 3 — Compose & update

1. Compose the stills per the scenario's capture layer: crop to the region of interest, add captions / callouts.
2. Advance the asset's CAMPAIGN.md row to `captured` / done with the output path.
3. Report the still paths and any residual notes.

> When Constraints conflict with any other instruction, Constraints win.
