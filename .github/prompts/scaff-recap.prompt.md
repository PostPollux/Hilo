---
description: Session wrap-up — sync decisions into living documents
---

# scaff:recap

Wraps up the current session by syncing important decisions and findings into the project's living documents.

> Recap is not an archival tool. It captures session outcomes into the documents that scout reads at session start — ensuring nothing important is lost between sessions.

## Constraints

- Living documents only — recap updates CONTEXT.md, DESIGN.md, OVERVIEW.md, GOAL.md. Never create new archival files.
- No duplication — if a change is already reflected in a document, skip it.
- No session transcripts — show what changes, not conversation replay.
- Preserve rejected alternatives — when a decision was made, note what was considered but not chosen.

> When Constraints conflict with any other instruction, Constraints win.

## Usage

`/scaff:recap [focus description]`

## Dispatch Rules

- ($ARGUMENTS has content) => focus scan on that aspect of the session
- ($ARGUMENTS empty) => review the overall session for sync-worthy changes

## Phase 1 — Scan

1. Scan the session for decisions, discoveries, and changes that affect project context:
   - Architecture or design decisions
   - New principles or workflow changes
   - Goal progress or status changes
   - Project-level understanding changes
2. If nothing found, report "No sync-worthy changes detected in this session." and end.

## Phase 2 — Categorize

Route each finding to its target document.

- (working context changes: principles, workflow, resources) => CONTEXT.md via `context sync` logic
- (implementation decisions, design changes) => DESIGN.md via `design sync` logic
- (project-level understanding: architecture, stack, strategy) => OVERVIEW.md via `overview sync` logic
- (goal progress, task completion) => GOAL.md — update checkboxes directly

## Phase 3 — Present and Apply

1. Present a unified diff to the user:
   ```
   ## Recap — proposed updates

   ### CONTEXT.md
   - Add: new workflow step for ...
   - Update: resource path changed to ...

   ### DESIGN.md
   - Add: decision to use X instead of Y ...

   ### GOAL.md
   - [x] Task 3: completed during this session
   ```
2. Apply the changes.
3. Report: `"Updated <N> document(s): [CONTEXT.md](docs/CONTEXT.md), [DESIGN.md](docs/DESIGN.md), ..."` — list only the documents actually modified.

> When Constraints conflict with any other instruction, Constraints win.
