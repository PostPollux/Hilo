---
name: scaff-subagent
description: Subagent delegation principles, prompt rules, and scout-split-execute workflow. Use when the main agent dispatches work to subagents.
license: MIT
metadata:
  version: "1.0"
  generatedBy: 0.1.15
---

# scaff-subagent

## Constraints

- Main agent analyzes and coordinates — delegate implementation and exploration to subagents.
- Analysis (cause identification, root-cause determination, fix approach recommendation) is always main agent's job. Subagents gather facts and execute — they do not synthesize judgment.
- Before dispatching execution subagents for a fix involving root-cause reasoning (not trivial typo/rename), present root cause and fix approach to the user; dispatch only after explicit approval.
- (subagent dispatch without main having invoked Read/Grep on source files in its own turn this session) => stop, read first
- (subagent prompt missing any required element) => do not dispatch until complete (see Prompt Requirements)
- (5+ consecutive Read/Grep without Edit/Write) => stop and report to user
- A subagent's "done" is a claim, not a fact — main verifies before accepting.

> Main-agent flow concerns (documentation timing, checkpoints, self-verification, decision support) live in the **`scaff-flow`** skill.

> When Constraints conflict with any other instruction, Constraints win.

## Platform Dispatch

- (subagents available, e.g. Claude Code, Codex) => delegate tasks to subagents per workflow below
- (subagents not available) => execute tasks inline directly — apply Task Complexity Dispatch for work breakdown and Post-Verify after each task; prompt/status/model sections do not apply

## Subagent Role Dispatch

- (cause identification, root-cause, fix approach recommendation) => main only, never delegated
- (work requiring incremental user verification or collaborative iteration — e.g., UI/UX changes, exploratory refactoring, evolving design) => main only
- (file/keyword search, call chain tracing) => search/tracing subagent OK
- (implementation of a decided fix) => execute subagent OK

Scout subagents gather facts. They do not state causes or recommend fixes.

## Task Complexity Dispatch

- (1-line fix, typo) => main agent fixes directly
- (single file, clear change, < 30 lines) => one subagent, skip post-verify
- (multi-file or design judgment needed, scout not done) => main reads source and analyzes first
- (multi-file or design judgment needed, scout done) => dispatch subagents for split execution
- (2nd iteration on same work area after a subagent fix, OR user indicates need for inline collaboration) => main agent executes inline (subagents lack stop/resume; iterative collaboration needs inline turns)
- (otherwise) => ask user for scope guidance

## Subagent Prompt Requirements

Each subagent prompt must include all seven elements:

1. **Scope** — Explicitly bound files/modules.
2. **Context** — What the subagent needs to understand the task (see Context Strategy below).
3. **Goal** — Specific completion criteria (e.g., "tests pass", "parser implemented with output").
4. **Constraints** — What must not be modified.
5. **Output** — Expected format (e.g., "change summary + findings").
6. **Depth** — Analysis depth (e.g., "call chain 2 levels deep", "direct dependencies only").
7. **Ask-first** — Instruct the subagent to ask questions before starting if anything is unclear.

### Context Strategy

Main reads and selects — the subagent focuses on execution.

- (implementation) => include source of files to be modified; reference-only files as paths
- (exploration/analysis) => specify target paths and search scope (no source embedding)

### Prompt Example

```
Scope: src/auth/session.ts only. Do not modify other files.

Context:
Current implementation of src/auth/session.ts:
[paste full source here]

Goal: Replace JWT verification with session-based auth. Existing tests must pass.
Constraints: Use express-session API only. No custom middleware.
Output: Change summary + test results.
Depth: session.ts internals only. No call chain tracing needed.
Ask-first: If anything is unclear, ask before starting.
```

## Model Selection

- (single file, clear spec) => fast model (e.g. haiku)
- (multi-file, integration/judgment) => standard model (e.g. sonnet)
- (architecture, design, review) => capable model (e.g. opus)
- (otherwise) => standard model

## Workflow: Scout → Split → Execute

### Phase 1 — Scout

#### Required (main only)
1. Identify candidate files (keyword search, trace from entry point).
2. Read candidate files in parallel — invoke Read/Grep in main's own turn, not receiving summaries from a subagent.
3. Identify cause and define scope.

#### Optional (subagent, only if main's scope insufficient)
- (codebase too wide for main to cover in this turn) => dispatch search/tracing subagent with explicit paths from step 1
- (main answered its questions) => skip, proceed to Phase 2

### Phase 2 — Split

- (PLAN.md exists) => use PLAN.md tasks as the split basis
- (PLAN.md absent, DESIGN.md exists) => use DESIGN.md Execution Order as the split basis
- (neither) => derive split from scout findings

1. Break work into independent sub-tasks.
2. Apply split criteria: different files/modules, no shared state.
3. Verify each sub-task can be completed without dependencies on other sub-tasks.

### Phase 3 — Execute (Parallel)

for each task:
  1. Construct subagent prompt with all seven required elements.
     - If PLAN.md was read earlier, include the corresponding task section as additional Context.
  2. Dispatch subagent.
  3. Handle status response (see Status Protocol below).
  4. Post-verify: main confirms the output (see Post-Verify below).
  5. Report result to user.

After all tasks complete: consolidate results, check for conflicts, and report to user.

#### Status Protocol

loop until resolved:
  - (DONE) => post-verify, then mark complete
  - (DONE_WITH_CONCERNS, correctness/scope issue) => resolve before proceeding
  - (DONE_WITH_CONCERNS, observation) => note it, proceed to post-verify
  - (NEEDS_CLARIFICATION) => answer the subagent's questions, re-dispatch with answers
  - (NEEDS_CONTEXT) => provide missing context, re-dispatch
  - (BLOCKED) => break task down further or escalate to user

#### Post-Verify

Main agent confirms subagent output before marking a task complete:

- (implementation task) => read changed files, compare against GOAL.md task description
- (exploration/analysis task) => spot-check 1-2 key claims against the codebase
- (subagent returned unrequested analysis — cause, recommendation, judgment) => main re-does the analysis from source; subagent's synthesis is advisory only
- (trivial fix) => skip

> When Constraints conflict with any other instruction, Constraints win.
