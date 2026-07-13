---
description: "Implementation design (DESIGN.md) management (init|sync|archive)"
---

# scaff:design

Manages `docs/DESIGN.md`. Records the **implementation design** for the current GOAL.

> If GOAL.md is "what/why", DESIGN.md is "how".
> Documents implementation plans, file change lists, key design decisions — implementation details that would be lost if only in chat.

## Lifecycle

DESIGN.md is paired 1:1 with GOAL.md:
- Created after GOAL.md when an implementation plan emerges
- Archived together with GOAL.md

## Constraints

- Never overwrite DESIGN.md without user confirmation.
- DESIGN.md requires a corresponding GOAL.md — do not create without one.

> When Constraints conflict with any other instruction, Constraints win.

## Usage

`/scaff:design <subcommand> [content]`

## Subcommand Dispatch

- (no subcommand given, `docs/DESIGN.md` absent) => run init
- (no subcommand given, `docs/DESIGN.md` exists) => prompt the user to choose
- (args = init) => see Subcommands: init
- (args = sync) => see Subcommands: sync
- (args = archive) => see Subcommands: archive

# Subcommands

## init

Creates `docs/DESIGN.md`.

1. Read `docs/GOAL.md`. A file read error means the file does not exist — **do NOT retry failed reads.** If absent, suggest setting a goal first.
2. Parse GOAL.md `id` and `goal` for context.
   - If GOAL.md has sub-tasks (from breakdown), note them as context for structuring the Execution Order.
3. If `$ARGUMENTS` has content, incorporate it.
4. Write based on the implementation plan discussed in the current session.
5. If DESIGN.md already exists, notify and confirm overwrite.
6. Report: `"Created [DESIGN.md](docs/DESIGN.md)."`
   - (GOAL.md has breakdown sub-tasks AND Execution Order structure differs significantly) => also notify: `"Execution Order differs from GOAL.md sub-task structure. Run /scaff:goal breakdown to adjust if needed."`

**Structure:**

```markdown
---
goal-id: <GOAL.md id>
created: YYYY-MM-DD
---

# Implementation Plan

## Files to Change

| File | Change | Description |
|------|--------|-------------|
| ... | new/modify | ... |

## Key Design Decisions

### 1. <Component/Module>
- Design decision and rationale

## Execution Order
1. ...
2. ...
```

Extend with project-appropriate sections.

## sync

Reviews current DESIGN.md and **proposes updates**.

1. Read `docs/DESIGN.md`. If absent, suggest init.
2. If `$ARGUMENTS` has content, use it as update direction.
3. Identify changes from the current session:
   - New design decisions
   - Updated file change list
   - Modified execution order
   - Design changes from trial-and-error
4. Present changes in **diff format**.
5. Apply the changes.
6. Report: `"Updated [DESIGN.md](docs/DESIGN.md)."`

## archive

Archives DESIGN.md.

1. Parse `goal-id` from `docs/DESIGN.md` front-matter.
2. Move to `docs/archive/goals/YYYY-MM-DD-<goal-id>/DESIGN.md`.
3. Report: `"Archived to [docs/archive/goals/YYYY-MM-DD-<goal-id>/DESIGN.md](docs/archive/goals/YYYY-MM-DD-<goal-id>/DESIGN.md)."`

> **Note**: `/scaff:goal archive` automatically archives DESIGN.md together with GOAL.md.

> When Constraints conflict with any other instruction, Constraints win.
