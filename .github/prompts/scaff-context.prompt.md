---
description: "Project context (CONTEXT.md) management (init|sync)"
---

# scaff:context

Manages `docs/CONTEXT.md`. Records the **current working context** of the project.

> CONTEXT.md is not a project overview or summary.
> It captures what is being worked on now, which resources are referenced, and what principles/workflows apply — **context the AI needs immediately at session start**.

## Constraints

- Never overwrite CONTEXT.md without user confirmation.
- Target ~100 lines or less — this file is read at every session start.

> When Constraints conflict with any other instruction, Constraints win.

## Usage

`/scaff:context <subcommand> [content]`

## Subcommand Dispatch

- (no subcommand given, `docs/CONTEXT.md` absent) => run init
- (no subcommand given, `docs/CONTEXT.md` exists) => prompt the user to choose
- (args = init) => see Subcommands: init
- (args = sync) => see Subcommands: sync

# Subcommands

## init

Creates `docs/CONTEXT.md`.

1. If CONTEXT.md already exists, notify and confirm overwrite.
2. If `$ARGUMENTS` has content, incorporate it.
3. Write project-specific context based on the current session discussion.
4. Use the skeleton below as a baseline, extending with project-specific sections.
5. Report: `"Created [CONTEXT.md](docs/CONTEXT.md)."`

**Skeleton:**

```markdown
# Project Brief
- <1-2 lines: what this project is and who it's for>
- <1-2 lines: core architecture or stack>
- For deeper architecture/decisions, see `docs/OVERVIEW.md` (if present).

# Goal Hierarchy
- If `docs/ROADMAP.md` exists, it contains the milestone plan.
  - Mark ROADMAP.md milestones as `done` when completed.
  - GOAL.md objectives are sub-units of ROADMAP.md milestones.

# Current Objective
- If `docs/GOAL.md` exists, treat it as the top priority.

# Principles

# Workflow
- Tasks live in `docs/GOAL.md` `## Tasks`. Front-matter requires an `id` (slug format).
- Implementation happens in `.`.
- Session progress: `/scaff:goal checkpoint` → `docs/CHECKPOINT.md` (overwritten per session).
```

**Project-specific sections** — extend the skeleton with sections appropriate to the project:

- **Resources**: Key file/directory paths and their descriptions
- **Process**: Project-specific procedures (e.g., porting rules, analysis doc management)
- **Index/Tables**: Frequently referenced item lists (e.g., analysis topics, API endpoints)
- **Extended Principles**: Project-specific principles (e.g., 1:1 logic preservation, no magic numbers)

## sync

Reviews current CONTEXT.md and **proposes updates**.

1. Read `docs/CONTEXT.md`. If absent, suggest init.
2. If `$ARGUMENTS` has content, use it as update direction.
3. Identify changes from the current session discussion that should be reflected.
4. Present changes in **diff format**:
   - Content to add
   - Content to modify
   - Outdated content to remove/update
5. Apply the changes.
6. Report: `"Updated [CONTEXT.md](docs/CONTEXT.md)."`

> When Constraints conflict with any other instruction, Constraints win.
