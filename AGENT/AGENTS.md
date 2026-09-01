# Agent Workflow

This repository uses a single-run worker-agent workflow.

## Required Run Order

1. Read `AGENT/AGENTS.md`.
2. Read `AGENT/STATE.md`.
3. Read `AGENT/TASKS.md`.
4. Find your assigned task ID.
5. Read only the relevant entries from `AGENT/DECISIONS.md`, `AGENT/ISSUES.md`, `AGENT/REVIEW.md`, and `AGENT/HANDOFF.md`.
6. Inspect the actual source files related to your task.

## Agent Identity

Use an identity in the format:

`agent:<provider>/<role>/<short-id>`

Example:

`agent:openai/backend/a12f`

## Working Rules

- Claim your task in `AGENT/TASKS.md` before starting unless it is already assigned to you.
- Work only within your assigned task scope.
- Do not overwrite another active agent's work.
- Do not change architecture or business decisions silently.
- Inspect files and code before changing them.
- Make the minimum necessary change.
- Run relevant checks when possible.
- Separate facts from assumptions.

## Required Repository Updates

If relevant to your task:

- Record new issues in `AGENT/ISSUES.md`.
- Record important decisions in `AGENT/DECISIONS.md`.
- Record review findings in `AGENT/REVIEW.md`.
- Update `AGENT/HANDOFF.md` when follow-up is required.

## Completion Rules

When your task is finished:

1. Update the task in `AGENT/TASKS.md`.
2. Update `AGENT/STATE.md` if project state materially changed.
3. Append a concise entry to `AGENT/WORKLOG.md`.
4. Update `AGENT/HANDOFF.md` if another agent must continue.

## Task States

- `IN_PROGRESS`
- `BLOCKED`
- `READY_FOR_REVIEW`
- `CHANGES_REQUESTED`
- `DONE`

Use `DONE` only when acceptance criteria are satisfied.
