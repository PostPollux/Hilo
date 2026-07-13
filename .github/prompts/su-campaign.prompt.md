---
description: "Manage CAMPAIGN.md — the manifest of a project's visual assets (videos and still sets) and the shared context every scenario inherits. Subcommands: init, add, status, archive."
---

# /su:campaign

Create and maintain the campaign manifest: the shared Context (target app, output defaults, tone) and the list of assets to produce, each tracked from drafted through done.

## Run

1. **Invoke the `su-campaign` skill** — the CAMPAIGN.md model, subcommand behavior, and lifecycle rules live there.
2. Parse the subcommand (`init` | `add` | `status` | `archive`), an optional asset `name`, and the `--video` / `--stills` type flag from `$ARGUMENTS`, and pass them to the skill.
3. (no subcommand, CAMPAIGN.md absent) => run `init`
4. (no subcommand, CAMPAIGN.md exists) => run `status`

## Work Principles

- Follow the CAMPAIGN.md model and lifecycle defined in the `su-campaign` skill.
- Follow the shared discipline in the `su-flow` skill (sandbox only, plain-file artifacts, one scenario per asset).

> When Constraints conflict with any other instruction, Constraints win.
