# Issue tracker: Linear

Issues and specs for this repo live in Linear, in the **Cortex** project under team **A-Developer-Company**.

## Conventions

- **Tooling**: the Linear CLI (`linear`). Install and authenticate it (`linear login`) before running commands — it is not currently on this machine's PATH.
- **Create an issue**: `linear issue create`, with the project set to `Cortex` (team `A-Developer-Company`).
- **Read / update / comment**: `linear issue view <id>`, `linear issue comment --id <id>`, `linear issue update <id>` (set labels, priority, status).
- **Labels and priorities**: keep Linear labels aligned with the triage vocabulary in `docs/agents/triage-labels.md`; set priority per the ticket's stated urgency.

## When a skill says "publish to the issue tracker"

Create a Linear issue in the Cortex project.

## When a skill says "fetch the relevant ticket"

`linear issue view <id>` (with comments).