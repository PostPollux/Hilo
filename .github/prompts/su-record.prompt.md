---
description: "Produce a staged demo video for an asset — drive the scenario while recording, then render cursor, ripples, zoom, captions, and titles as overlays. Chains scenario authoring if the asset has none."
---

# /su:record

Roll the scenario and cut a finished video: record the deterministic run, then render the staging cues onto it via ffmpeg (quick) or Remotion (polish).

## Run

1. **Invoke the `su-record` skill** — the record → render → verify pipeline and the direction (staging) judgment live there.
2. Parse the `<asset-name>` and optional `--path quick|polish` from `$ARGUMENTS`, and pass them to the skill.
3. (the asset has no scenario yet) => the skill chains `su-scenario` to author one first.

## Work Principles

- Follow the pipeline defined in the `su-record` skill (ensure scenario → record → render → verify → update the campaign).
- Follow the shared discipline in the `su-flow` skill (staging is post-production; re-render for cue changes, re-record only when scenes change).

> When Constraints conflict with any other instruction, Constraints win.
