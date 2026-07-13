---
description: "Project goal (GOAL.md) management (init|breakdown|checkpoint|suspend|resume|archive)"
---

# scaff:goal

Manages `docs/GOAL.md`.

## Constraints

- GOAL.md is the single source of truth for the current goal's state.
- Never overwrite GOAL.md without user confirmation.
- Preserve existing check states when updating tasks.
- Task numbers use hierarchical dot notation: `1.`, `1.1.`, `1.2.1.` — numbers are part of the checklist text, no separate id field.

> When Constraints conflict with any other instruction, Constraints win.

## Usage

`/scaff:goal <subcommand> [content]`

## Subcommand Dispatch

- (no subcommand given, `docs/GOAL.md` absent) => run init
- (no subcommand given, `docs/GOAL.md` exists) => prompt the user to choose
- (args = init) => see Subcommands: init
- (args = breakdown) => see Subcommands: breakdown
- (args = checkpoint) => see Subcommands: checkpoint
- (args = suspend) => see Subcommands: suspend
- (args = resume) => see Subcommands: resume
- (args = archive) => see Subcommands: archive

# Subcommands

## init

Creates `docs/GOAL.md`.

1. If `$ARGUMENTS` has content, use it to write the goal.
2. If empty, derive from the current session discussion.
3. If GOAL.md already exists, notify the user and confirm overwrite.
4. Write GOAL.md with the format below.
5. Assess task granularity:
   - (tasks are complex, embed multiple implicit steps) => recommend `/scaff:goal breakdown` with 1-line rationale
   - (tasks are specific and actionable) => recommend `/scaff:design init` (implementation task) or `/scaff:go` (analysis task) with 1-line rationale
6. Report: `"Created [GOAL.md](docs/GOAL.md)."`

GOAL.md format:
```yaml
---
id: <goal-slug>
goal: <one-line summary>
status: in-progress
started: YYYY-MM-DD
---
```

Body structure:
```markdown
## Tasks

- [ ] 1. Task one
- [ ] 2. Task two
- [ ] 3. Task three
```

- Top-level tasks are numbered `1.`, `2.`, `3.`.
- Sub-tasks inherit parent number: `1.1.`, `1.2.`, and deeper: `1.2.1.`, `1.2.2.`.

## breakdown

Decomposes existing GOAL.md tasks into sub-tasks.
At `goal init` time only high-level tasks are written; use breakdown when detailed decomposition emerges through discussion.

Usage: `/scaff:goal breakdown [task-number]`

### Breakdown Targeting

- (no task number given) => decompose all top-level tasks
- (task number given, e.g. `2`) => decompose that specific task only
- (sub-task number given, e.g. `1.2`) => decompose into `1.2.1`, `1.2.2`, etc.

### Steps

1. Read `docs/GOAL.md` and `docs/DESIGN.md` at once (parallel if supported, sequential otherwise). Skip if already loaded. A file read error means the file does not exist — **do NOT retry failed reads.**
2. Identify target tasks based on targeting rules above.
3. Derive sub-tasks:
   - If DESIGN.md was found and has an Execution Order section, use it as a reference for deriving sub-tasks.
   - If discussion context provides additional detail, incorporate it.
   - If neither is sufficient, analyze task nature and propose sub-tasks.
4. Present decomposition as nested checklists with hierarchical numbers:
   ```markdown
   - [ ] 1. Top-level task
     - [ ] 1.1. Sub-task
     - [ ] 1.2. Sub-task
       - [ ] 1.2.1. Sub-sub-task
       - [ ] 1.2.2. Sub-sub-task
   ```
   - Each nesting level appends a sequential number to the parent's prefix.
   - Indent with 2 spaces per level.
5. Renumber all tasks at the affected level to ensure sequential ordering (no gaps).
6. Update GOAL.md.
   - (target task already has sub-tasks) => ask user whether to merge or replace before writing
7. Report: `"Updated [GOAL.md](docs/GOAL.md) — decomposed <N> task(s) into <M> sub-tasks."`
8. Assess design necessity:
   - (sub-tasks include code implementation, file changes, or architecture decisions) => recommend `/scaff:design init` with 1-line rationale
   - (sub-tasks are analysis/RE/investigation focused) => recommend `/scaff:go` with 1-line rationale

## checkpoint

Saves a progress snapshot to `docs/CHECKPOINT.md`.
Single file, overwritten each time — the AI only needs the latest state to resume.
Prevents loss of mid-goal progress when context is compacted.

1. Read `docs/GOAL.md` and `docs/PLAN.md` at once (parallel if supported, sequential otherwise). Skip if already loaded. A file read error means the file does not exist — **do NOT retry failed reads.**
2. Requires GOAL.md front-matter `id`.
3. If `$ARGUMENTS` has content, incorporate it.
4. Write based on the current session:
   - Work performed in this session
   - Findings / analysis results
   - Next steps for the following session
5. If PLAN.md was found and implementation approach changed during this session, update PLAN.md accordingly.
6. Save to `docs/CHECKPOINT.md` (overwrite if exists).
7. Report: `"Saved [CHECKPOINT.md](docs/CHECKPOINT.md)."` — append `" Also updated [PLAN.md](docs/PLAN.md)."` if PLAN.md was modified in step 5.

CHECKPOINT.md format:
```yaml
---
goal-id: <GOAL.md id>
session-date: YYYY-MM-DD
---
```

```markdown
## Work Summary
- ...

## Findings
- ...

## Next Steps
- ...
```

## suspend

Suspends the current GOAL to work on something else.

1. Read `docs/GOAL.md` and parse front-matter `id`.
2. Set front-matter `status` to `suspended`.
3. Create `docs/suspended/<goal-id>/` directory.
4. Move `docs/GOAL.md` → `docs/suspended/<goal-id>/GOAL.md`.
5. If `docs/CHECKPOINT.md` exists, move it → `docs/suspended/<goal-id>/CHECKPOINT.md`.
6. If `docs/DESIGN.md` exists, move it → `docs/suspended/<goal-id>/DESIGN.md`.
7. If `docs/PLAN.md` exists, move it → `docs/suspended/<goal-id>/PLAN.md`.
8. Report: `"Suspended GOAL to [docs/suspended/<goal-id>/](docs/suspended/<goal-id>/). Start a new goal with /scaff:goal init or resume with /scaff:goal resume."`

## resume

Resumes a previously suspended GOAL.

1. Read `docs/GOAL.md` and list directories in `docs/suspended/` at once (parallel if supported, sequential otherwise). A file read error means the file does not exist — **do NOT retry failed reads.**
   - If GOAL.md exists, warn: "Active GOAL exists. Suspend or archive it first."
2. Process suspended goals list:
   - (none found) => report "No suspended goals."
   - (exactly one) => auto-select it
   - (multiple, session context permits a confident recommendation) => present list with a single recommendation per `scaff-flow` User Decision Support (Recommendation + Basis + GOAL relevance)
   - (multiple, no clear context) => present list for user selection
3. Move `docs/suspended/<goal-id>/GOAL.md` → `docs/GOAL.md`.
4. If `CHECKPOINT.md` exists in the suspended folder, move it → `docs/CHECKPOINT.md`.
5. If `DESIGN.md` exists in the suspended folder, move it → `docs/DESIGN.md`.
6. If `PLAN.md` exists in the suspended folder, move it → `docs/PLAN.md`.
7. Set front-matter `status` back to `in-progress`.
8. Remove the now-empty `docs/suspended/<goal-id>/` directory.
9. Report: `"Resumed [GOAL.md](docs/GOAL.md): <goal summary>."`

## archive

Archives the current GOAL.md and its siblings.

1. Read `docs/GOAL.md` and parse front-matter `id`.
2. Set front-matter `status` to `done` and add `completed: YYYY-MM-DD`.
3. Determine archive directory: `docs/archive/goals/YYYY-MM-DD-<id>/`.
   - (directory already exists) => append `-<N>` (e.g., `YYYY-MM-DD-<id>-2/`)
4. Move all goal-scoped files to the archive directory:
   - `docs/GOAL.md` → archive/GOAL.md
   - (DESIGN.md exists) => archive/DESIGN.md
   - (PLAN.md exists) => archive/PLAN.md
   - (CHECKPOINT.md exists) => archive/CHECKPOINT.md
5. If `docs/ROADMAP.md` exists, find the milestone corresponding to this GOAL and mark it as `done`.
6. Report: `"Archived <N> file(s) to [docs/archive/goals/YYYY-MM-DD-<id>/](docs/archive/goals/YYYY-MM-DD-<id>/): <file list>. Set a new goal with /scaff:goal init."`

> When Constraints conflict with any other instruction, Constraints win.
