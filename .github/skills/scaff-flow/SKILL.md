---
name: scaff-flow
description: Main-agent flow principles for scaff workflows — documentation timing, CONTEXT.md self-sync, checkpoint triggers, OVERVIEW.md reactive read, self-verification, and decision support. Use whenever the main agent is driving a scaff session, regardless of subagent availability.
license: MIT
metadata:
  version: "1.0"
  generatedBy: 0.1.15
---

# scaff-flow

## Constraints

- Never execute documentation commands automatically — suggest only.
- Never auto-read OVERVIEW.md. Only read after a reactive trigger fires AND the user approves.
- Self-verification is mandatory before marking any GOAL.md task or ROADMAP.md milestone as done.
- Handoff recommendations (after any scaff command or task completes) are single-path and decisive — do not enumerate alternatives. When two next-steps both seem reasonable, pick based on Self-Verification status, GOAL.md priority, and risk profile; do not push the choice to the user. Presenting multiple options applies only to genuine decision forks, not handoffs.

> When Constraints conflict with any other instruction, Constraints win.

## Command Recognition

Interpret user input as scaff command execution when intent is clear from context — no explicit `/scaff` prefix required.

Execute when any of:
- **Explicit invocation** (with or without minor deviations): `/scaff:goal init`, `/scaff goal init`, `/scaff:goal init & design init`
- **Confirmation of pending action**: AI recommended a specific scaff command in the prior turn, user reply is a brief confirmation ("ok", "yes", "go")
- **Continuation in active flow**: user names the next scaff step in ongoing context (e.g., "breakdown now" after goal init)
- **Task-execution intent**: user expresses task-level intent that maps to a scaff command (e.g., "proceed with task N" → `/scaff:go`, "save progress" → `/scaff:goal checkpoint`, "archive this goal" → `/scaff:goal archive`)

> Destructive operations (overwriting existing files, archive) still follow state-aware prompts — in-context confirmation does not bypass those guards.

## Documentation Timing

- (implementation plan crystallizes — files, design decisions, execution order) => suggest `/scaff:design init`
- (design changes during implementation) => suggest `/scaff:design sync` if `docs/DESIGN.md` exists, else `/scaff:design init`
- (project context changes — principles, resources, processes) => suggest `/scaff:context sync` if `docs/CONTEXT.md` exists, else `/scaff:context init`
- (multiple GOALs need a higher-level plan) => suggest `/scaff:roadmap init`
- (new milestone identified) => suggest `/scaff:roadmap add` if `docs/ROADMAP.md` exists, else `/scaff:roadmap init`
- (DESIGN.md step completed) => suggest `/scaff:design sync`
- (multiple design decisions or context changes accumulated but not yet documented) => suggest `/scaff:recap`

Keep suggestions brief: "Implementation plan ready — document with `/scaff:design init`?"

## CONTEXT.md Self-Sync

CONTEXT.md is the main agent's working memory — it should grow as the session reveals new project facts. Suggest `/scaff:context sync` proactively when any of these signals fire:

- (new resource discovered — file, directory, external system worth referencing) => suggest sync
- (workflow step refined — a procedure the AI repeats and should remember) => suggest sync
- (new project principle articulated by user — e.g. "always do X", "never do Y") => suggest sync
- (new analysis topic / index entry — for projects that maintain analysis tables) => suggest sync
- (session about to end AND uncommitted context changes accumulated) => suggest sync as part of wrap-up

Cap: at most one CONTEXT.md sync suggestion per session unless the user explicitly accepts an earlier one.

## OVERVIEW.md Reactive Read

OVERVIEW.md is a project-level architectural reference. It is **never auto-loaded**. Read it only when a reactive event explicitly signals that big-picture context is missing:

- (GOAL intent appears to conflict with the actual code structure) => check for OVERVIEW.md, ask user before reading
- (a subagent reports "project-wide context needed" or paraphrases architecture inaccurately) => same
- (user prompt literally asks "why was X designed this way?", "what's the overall structure?", "big picture", or types `docs/OVERVIEW.md`) => same
- (otherwise) => do NOT read OVERVIEW.md, do NOT suggest reading

When the trigger fires:
1. Confirm `docs/OVERVIEW.md` exists (existence check only).
2. If absent, inform the user and proceed without it.
3. If present, surface the affordance to the user — *do not auto-read*. Example: "Architectural ambiguity detected. `docs/OVERVIEW.md` is available — load it?"
4. Read only after explicit user approval, then keep the result in session (skip-if-loaded for subsequent triggers).

> Bias control: when the trigger condition is uncertain, **default to NOT reading**. The cost of missing one read is small; the cost of always-loading is structural.

## Checkpoint Triggers

A checkpoint exists to survive context loss (compaction) *mid-goal*. Only two things justify suggesting one:

1. (platform surfaces a compaction-imminent / auto-compact / context-limit notice, or exposes actual context-usage figures nearing the limit — e.g. an injected system warning) => suggest `/scaff:goal checkpoint` NOW. This is the only reliable context-pressure signal. Never estimate your own context % or infer pressure from how long the session "feels" — that estimate tracks turn count, not tokens, and misfires early.
2. (user explicitly asks to save/pause, or is ending the session) => suggest `/scaff:goal checkpoint`.

On platforms that inject no warning, rule 2 is the only trigger — this is intentional: GOAL.md checkboxes and docs/logs already persist state as work completes, so a missed checkpoint is cheap.

> Do NOT suggest a checkpoint on task count, milestone/goal completion, or a sense that the session has "grown long." At goal completion the right move is `/scaff:goal archive`, not a checkpoint. When in doubt, stay silent.

## Blocker Handling

When the current goal cannot proceed (discovered bug, missing dependency, blocking issue):

- (blocker identified, current GOAL cannot progress) => suggest `/scaff:goal suspend` followed by `/scaff:goal "<blocker description>"` to address the blocker as its own goal
- (blocker goal archived, suspended goals remain) => suggest `/scaff:goal resume` to continue a suspended goal
- (nested blockers) => same pattern recursively; `suspended/<goal-id>/` stacks naturally, `resume` presents a list when multiple

This preserves "one active GOAL.md at a time" — simpler than in-place stacking schemes.

## Self-Verification

Before checking off a GOAL.md task or ROADMAP.md milestone as "done", verify:

> **"Is this output ready to be used directly in the next step?"**

1. **Analysis tasks**: Are there unconfirmed items (unknown fields, untraced calls, estimated values)?
2. **Implementation tasks**: Do tests pass? Were edge cases considered?
3. **Documentation tasks**: Are there missing sections or placeholders?

- (anything lacking) => do not check off, report gaps to user, verify again after remediation

## Execution Handoff

- (goal breakdown completed) => suggest `/scaff:go`
- (design init completed) => suggest `/scaff:go`
- (goal resumed from suspension) => suggest `/scaff:go`
- (goal checkpoint saved, tasks remain) => suggest `/scaff:go`
- (session start, active GOAL.md with uncompleted tasks) => suggest `/scaff:go`

## User Decision Support

When responding to the user with multiple options — implementation choices, next scaff step, design alternatives, or any decision branching — include:

1. **Recommendation** — Highlight one option with rationale.
2. **Basis** — 1-line expected outcome (and tradeoff if any).
3. **GOAL relevance** — Which option aligns most with the current goal (skip if no active GOAL.md).

> When Constraints conflict with any other instruction, Constraints win.
