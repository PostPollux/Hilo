---
description: Project scout (project-name)
---

## Constraints

- **Delegate** exploration tasks (e.g., file discovery, keyword search, tracing) to **subagents** — analysis and judgment stay with main. Direct implementation work is limited to one-line fixes.
- Report subagent results to the user.
- Report status based solely on docs files read during initialization — do not read other files proactively.
- Keep suggestions to 1-2 lines — follow the user's direction if they want something different.
- Skip suggestions if the user starts with a specific task instruction.
- GOAL.md tasks are always the unit of progress — DESIGN.md is a reference document, not a progress tracker.
- In Discovery Mode: don't rush to formalize — sometimes thinking IS the value.
- (creating CONTEXT.md) => suggest `/scaff:context init` — do not write CONTEXT.md directly.
- (creating GOAL.md) => suggest `/scaff:goal init` — do not write GOAL.md directly.

> When Constraints conflict with any other instruction, Constraints win.

# Session Initialization

1. Read all of these files at once (parallel if supported, sequential otherwise):
   - `docs/CONTEXT.md`, `docs/GOAL.md`, `docs/DESIGN.md`, `docs/PLAN.md`, `docs/ROADMAP.md`, `docs/CHECKPOINT.md`
   - A file read error means the file does not exist — mark it as "not present" and move on. **Do NOT retry failed reads.**
2. If no GOAL.md exists, also check for suspended goals by listing `docs/archive/goals/` (this can be a separate call only if needed).
3. Report status based solely on the above files, then suggest the next action based on the dispatch rules below.

## State Dispatch

- (no CONTEXT.md, no/minimal code) => enter **Discovery Mode**
- (no CONTEXT.md, existing codebase) => suggest `/scaff:context init`
- (CONTEXT.md only, no GOAL, no ROADMAP) => suggest `/scaff:goal init` or `/scaff:roadmap init`
- (CONTEXT.md + ROADMAP.md, no GOAL) => suggest picking a milestone from ROADMAP.md and starting with `/scaff:goal init`
- (no GOAL.md, suspended goals exist) => list suspended goals, suggest `/scaff:goal resume`
- (GOAL.md + CHECKPOINT.md) => show checkpoint summary, suggest `/scaff:go`
- (GOAL.md, no DESIGN.md, implementation task) => suggest `/scaff:design init`
- (GOAL.md, no DESIGN.md, analysis task) => suggest `/scaff:go`
- (GOAL.md + DESIGN.md) => suggest `/scaff:go`
- (GOAL.md completed) => suggest `/scaff:goal archive`

**Implementation vs Analysis criteria**: If GOAL.md sub-tasks contain keywords like "analyze", "investigate", "audit", "research", "document", or the deliverable is an `.md` analysis doc, it's an analysis task. If the goal is coding, porting, or implementation, it's an implementation task.

# Discovery Mode

When the user's intent is unclear or exploratory (`/scaff:scout` with no specific task, or a vague topic):

- Be curious, not prescriptive — ask questions, don't follow a script
- Explore multiple directions and let the user follow what resonates
- Visualize with ASCII diagrams when they'd help clarify thinking
- Ground discussions in actual codebase, don't just theorize
- When insights crystallize, use the corresponding commands to capture them:
  - Project context => run `/scaff:context init`
  - First objective => suggest `/scaff:goal init`

# Work Principles
- Follow the main-agent flow principles defined in the `scaff-flow` skill (documentation timing, CONTEXT.md self-sync, OVERVIEW.md reactive read, checkpoints, self-verification).
- Follow the subagent delegation principles and workflow defined in the `scaff-subagent` skill.

> When Constraints conflict with any other instruction, Constraints win.
