---
name: su-scenario
description: Author one asset's scenario (screenplay.yaml) — the platform-neutral demo contract that both su-record and su-capture consume. Plan the demo in conversation, transcribe it into scenes and direction cues, resolve selectors, and rehearse with a dry-run. Entry point when the user wants to write or revise a demo scenario; also chained by su-record and su-capture when an asset has no scenario yet.
license: MIT
metadata:
  version: "0.1.0"
---

# su-scenario

The engineering core of `su` is control + recording; this authoring layer is where the human plan becomes a machine-readable scenario. The outcome of the discussion **is** the `screenplay.yaml` — authoring is transcription of an agreed plan, not invention. Both outputs (su-record, su-capture) consume this one file.

All user-facing output is in the project's configured language — this skill's English is instruction only.

## Constraints

- The scenario is the single source of truth for one asset — one `screenplay.yaml` per asset, named for the asset.
- Transcribe the agreed plan; do not invent scenes the user did not ask for.
- Inherit shared settings from CAMPAIGN.md Context — write the scenario's `meta` only where it differs.
- Recorded `scenes` carry no runtime lookups — every selector is resolved to a coordinate before capture (the dry-run's normalize pass is the oracle).
- (a selector resolves to nothing, or to more than one target) => fix the scenario, never guess a coordinate.
- State prep goes in `setup` (unfilmed), never in scenes.
- (invoked as a chained sub-skill by su-record / su-capture) => author and dry-run without extra interactive prompts, then return the validated scenario path.
- Follow the shared discipline in the `su-flow` skill.

> When Constraints conflict with any other instruction, Constraints win.

## Scenario Shape

Four sections in `screenplay.yaml` (`version: "0"`); the full field reference lives in the schema (`src/schema/screenplay.ts`).

- **meta** — `target` (obsidian / android) + window/output. Most of this is inherited from CAMPAIGN.md Context; override only differences.
- **setup** — unfilmed prep via the driver API: reach a deterministic clean start (open the note, reset state, close leftover panes).
- **scenes** — filmed deterministic steps: `move` / `click` / `drag` / `type` / `key` / `wait` / `scroll`, each targeting a selector (resolved at dry-run) or literal coordinate. Pacing is first-class: scene `pace`, `wait`, typing `cadence`.
- **direction** — staging cues anchored to `sceneId/stepIndex`: `zoom`, `speed`, `captions`, `title`. Rendered as overlays later, not baked into the run.

## Chained vs Standalone

- (standalone, `/su:scenario <name>`) => full interactive authoring: discuss, then run the phases below.
- (chained by su-record / su-capture, asset has no scenario) => run the phases with the plan taken from the caller's context, dry-run to green, return the path — no separate discussion prompt.

# Workflow

## Phase 1 — Discuss

1. Plan the demo narrative with the user: what to show, scene breakdown, captions, tone and pacing.
2. Ground it in the campaign Context (app, version, output defaults) so the scenario inherits rather than repeats.
3. Settle the plan before writing — the agreed plan is what gets transcribed.

## Phase 2 — Author

1. (`--from <file>`) => start from that scenario and adapt; else start from a worked example.
2. Write `demos/<asset-name>.screenplay.yaml`: meta overrides, setup prep, scenes, direction cues.
3. Author selectors from knowledge of the target UI — the dry-run verifies them.

## Phase 3 — Rehearse (dry-run)

1. Dry-run the scenario (`su run <scenario> --dry-run`): launches the sandbox, runs setup, resolves every selector, plays the scenes unrecorded, writes `timeline.dryrun.json`.
2. (a selector fails to resolve) => fix the scenario and dry-run again (see Constraints).
3. Repeat until selectors resolve and the on-screen pacing is right.
4. Record the scenario path in the asset's CAMPAIGN.md row and report; suggest `/su:record` or `/su:capture <asset>`.

> When Constraints conflict with any other instruction, Constraints win.
