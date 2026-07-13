---
name: su-flow
description: Shared engineering discipline for every screen-use (su) command — sandbox isolation, no improvisation during capture, plain-file artifacts, setup/scene separation, and the driver/timeline infrastructure that both outputs (stills and video) share. Referenced by su-campaign, su-scenario, su-record, and su-capture; use whenever driving any su command.
license: MIT
metadata:
  version: "0.1.0"
---

# su-flow

screen-use (`su`) turns a scenario document into visual assets — **stills** (su-capture) and **video** (su-record) — by driving a real app deterministically and recording the result. This skill holds the discipline every su command obeys. It is not invoked directly; the portal skills reference it in their `## Work Principles`.

## Constraints

- **Sandbox only.** Drive a dedicated demo target (sandbox vault / test device data), never the user's real app data — the runner launches an isolated instance, verifies it attached to that target, and refuses any other. The debug port is open only for the session.
- **Never improvise during capture.** All exploration (UI lookup, selector→coordinate resolution) happens before the recorder or screenshotter runs. Filmed steps replay as fixed coordinates + fixed timing — no LLM, no UI query in the loop.
- (a take or shot goes wrong) => stop, fix the scenario, re-run — never patch a live run.
- **State prep goes in `setup`, not scenes.** Setup runs unfilmed via the driver API and must leave a deterministic clean start; scenes show only what the viewer should see.
- **Staging is post-production.** Zoom, speed, captions, cursor, ripples, titles are `direction:` cues rendered as overlays — changing them needs a re-render, not a new take.
- **Every artifact is a plain file; every stage is an independent CLI step** — nothing needs an agent in the loop to re-run. Do not hide state in an agent's memory.
- (recording is in progress) => keep the window recordable — do not minimize it or change display scaling mid-session.

> When Constraints conflict with any other instruction, Constraints win.

## Shared Infrastructure

The two outputs are the same machine with a different final stage — this is why one scenario feeds both.

- **Scenario (`screenplay.yaml`)** — the single source of truth for one asset: `meta` (target app/window + output geometry), `setup` (unfilmed prep), `scenes` (filmed deterministic steps), `direction` (staging cues anchored to `sceneId/stepIndex`). Authored by su-scenario.
- **Driver** — resolves selectors, plays the scenes, timestamps every action. Drivers: `obsidian` (CDP, Electron/web), `android` (adb). One contract, added platforms plug in.
- **timeline.json** — the join between what the driver did (wall-clock stamps) and what the recorder captured (frame times). Direction anchors become time ranges through it; it is what lets renders repeat and restyle without re-recording.
- **Output stage** — su-record continuously records and renders a staged video; su-capture screenshots at anchor points for crisp stills. Both consume the same scenario + driver; only the last stage differs.

## Domain Model

- A **campaign** (CAMPAIGN.md, owned by su-campaign) bundles the related visual assets of a project and holds the shared Context every scenario inherits.
- An **asset** is one deliverable — a video (su-record) or a still set (su-capture) — produced from one scenario.
- Producing an asset updates its status row in CAMPAIGN.md; the campaign is the manifest of what exists and what still needs (re)producing.

> When Constraints conflict with any other instruction, Constraints win.
