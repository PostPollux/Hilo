---
description: "Produce a set of stills for an asset — drive the scenario and take a crisp screenshot at each anchor point, then compose crops and captions. Chains scenario authoring if the asset has none."
---

# /su:capture

Drive the scenario and snapshot it at anchored moments into uncompressed stills — app-store shots, docs figures, step-by-step guides — sharing the same scenario and driver as the video path.

## Run

1. **Invoke the `su-capture` skill** — the drive → screenshot → compose pipeline and the still-selection judgment live there.
2. Parse the `<asset-name>` and optional `--out <dir>` from `$ARGUMENTS`, and pass them to the skill.
3. (the asset has no scenario yet) => the skill chains `su-scenario` to author one first.

## Work Principles

- Follow the pipeline defined in the `su-capture` skill (ensure scenario → drive + screenshot at anchors → compose → update the campaign).
- Follow the shared discipline in the `su-flow` skill (sandbox only, never improvise, plain-file artifacts).

> When Constraints conflict with any other instruction, Constraints win.
