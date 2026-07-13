---
description: Execute the next task in GOAL.md
---

# scaff:go

## Constraints

- **Delegate** implementation tasks to **subagents** — direct work is limited to one-line fixes.
- Report subagent results to the user after each task completes.

> When Constraints conflict with any other instruction, Constraints win.

## Execution

1. If GOAL.md and CONTEXT.md were already read in this session, skip to step 3.
2. Read `docs/GOAL.md`, `docs/CONTEXT.md`, `docs/DESIGN.md`, and `docs/PLAN.md` at once (parallel if supported, sequential otherwise). A file read error means the file does not exist — **do NOT retry failed reads.**
   - If GOAL.md is absent: "No goal set. Run `/scaff:goal init` first, or tell me what to work on."
3. Find the next incomplete task in GOAL.md.
   - (task has step annotation `— Step N/M`) => resume from the indicated step
4. PLAN.md dispatch:
   - (PLAN.md exists) => read the corresponding task section for implementation context
   - (PLAN.md absent, task complexity ≥ multi-file) => generate PLAN.md, then report: `"Created [PLAN.md](docs/PLAN.md)."`
   - (PLAN.md absent, task complexity < multi-file) => proceed without PLAN.md
5. Execute tasks using the Task Outcome loop below.
6. Suggest `/scaff:goal checkpoint` only per the checkpoint triggers in the `scaff-flow` skill (platform context-pressure signal, or user pause/session end) — never on task count or goal completion.

## Task Outcome

loop until (all tasks complete OR user pause):
  - (success) => mark task done in GOAL.md, update PLAN.md if implementation approach changed
  - (success, task had Steps) => remove step progress annotation from GOAL.md task
  - (step completed, more steps remain) => update GOAL.md task with step progress: `— Step N/M (status)`
  - (blocked) => report issue and ask user how to proceed
  - (all tasks complete) => suggest `/scaff:goal archive` once; do not repeat if user does not act on it

## Diverge Check

- (DESIGN.md and PLAN.md both exist, Files lists differ)
  => warn: `"[DESIGN.md](docs/DESIGN.md) and [PLAN.md](docs/PLAN.md) file lists differ. Run /scaff:design sync to review."`

## Work Principles
- Follow the main-agent flow principles defined in the `scaff-flow` skill (documentation timing, CONTEXT.md self-sync, OVERVIEW.md reactive read, checkpoints, self-verification).
- Follow the subagent delegation principles and workflow defined in the `scaff-subagent` skill.

> When Constraints conflict with any other instruction, Constraints win.
