---
name: su-record
description: Produce a staged demo video from a scenario — drive the deterministic run while recording, then render cursor, click ripples, zoom, speed, captions, and titles as overlays via ffmpeg (quick) or Remotion (polish). Entry point when the user wants a demo video, screencast, or staged walkthrough of an app. Chains su-scenario when the asset has no scenario.
license: MIT
metadata:
  version: "0.1.0"
---

# su-record

The video output portal. It ensures a scenario exists, records the run, renders the staging cues, verifies the result, and updates the asset's row in CAMPAIGN.md. Recording and staging are decoupled through `timeline.json` — cue changes need only a re-render, never a new take.

All user-facing output is in the project's configured language — this skill's English is instruction only.

## Constraints

- Never improvise during recording — the scenario is fixed before the recorder rolls (see su-flow).
- (a take is wrong) => stop, fix the scenario, re-record — never patch a live run.
- Staging (zoom / speed / captions / cursor / ripples / title) is post-production — a cue change is a re-render, not a re-take.
- Re-record only when `scenes` or `setup` change; direction-only edits re-render off the existing `timeline.json`.
- (followCursor zoom at a payoff moment) => end the zoom before the moment so it plays in full frame — a large followCursor zoom crops the subject out.
- Advance the asset's CAMPAIGN.md status as the pipeline progresses; never leave it stale after a successful render.
- Follow the shared discipline in the `su-flow` skill.

> When Constraints conflict with any other instruction, Constraints win.

## Render Paths

- **quick** (default) — single-pass ffmpeg: cursor, click ripples, zoom, captions, speed warps, title. Fast; use for iteration and most finals.
- **polish** — Remotion: dark canvas, recording card, eased cursor, animated ripples, lower-third captions, title sweep as React components. Higher production value; heavier.
- (iterating on direction) => quick. (final hero asset) => polish.

# Workflow

## Phase 1 — Ensure the scenario

1. Read the asset's row in CAMPAIGN.md.
2. (no scenario path) => chain the `su-scenario` skill to author and dry-run one, then continue.
3. (scenario exists) => confirm it still dry-runs clean if the app/version changed.

## Phase 2 — Record

1. Run the scenario with the recorder (`su run <scenario>`): sandbox launch, setup, scene playback, capture.
2. Produces `recording.mp4`, `recording.manifest.json`, `timeline.json` in the asset's output dir.
3. (playback or capture failed) => fix the scenario, re-record (Constraints).

## Phase 3 — Render

1. Choose the path (Render Paths above) and render (`su render` / `su finalize`).
2. Judge the direction cues against the recording — verify payoff moments are in frame (Constraints), captions land, pacing reads.
3. (a cue is off) => edit `direction:` and re-render off the same `timeline.json` — do not re-record.

## Phase 4 — Verify & update

1. Verify the output: geometry, duration, and that overlays land on the intended frames (extract frames to check).
2. Advance the asset's CAMPAIGN.md row to `rendered` / done with the output path.
3. Report the artifact path and any residual notes.

> When Constraints conflict with any other instruction, Constraints win.
