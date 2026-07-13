---
description: "Author one asset's scenario (screenplay.yaml) — plan the demo in conversation, write it down, resolve selectors, and rehearse with a dry-run until it plays clean. Inherits the campaign's shared Context."
---

# /su:scenario

Turn an agreed demo plan into a validated `screenplay.yaml` for one asset: discuss what to show, transcribe it into scenes and direction cues, and dry-run until every selector resolves and the pacing feels right.

## Run

1. **Invoke the `su-scenario` skill** — the authoring procedure and the recorded/staging rules live there.
2. Parse the `<asset-name>` and optional `--from <file>` (adapt an existing scenario) from `$ARGUMENTS`, and pass them to the skill.
3. Inherit shared settings from CAMPAIGN.md Context; write the asset's `meta` only where it differs.

## Work Principles

- Follow the authoring procedure defined in the `su-scenario` skill (discuss → author → resolve selectors → dry-run).
- Follow the shared discipline in the `su-flow` skill (sandbox only, never improvise during capture, setup vs scenes).

> When Constraints conflict with any other instruction, Constraints win.
