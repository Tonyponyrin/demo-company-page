# Decisions

## 2026-09-01 - D-001 - Bootstrap coordination files

- Agent: `agent:openai/setup/a001`
- Status: Accepted
- Context: The repository had no existing workflow or coordination documents.
- Decision: Initialize the repository with the standard worker-agent coordination files and track the first task as a bootstrap task.
- Consequence: Future agents can follow a consistent process without relying on chat history.

## 2026-09-01 - D-002 - Group workflow documents under `AGENT/`

- Agent: `agent:openai/setup/a002`
- Status: Accepted
- Context: The repository contains only workflow coordination documents, and the requested layout groups them in one dedicated directory.
- Decision: Store all coordination documents, including the blank `design.md`, in `AGENT/`; future agents begin with `AGENT/AGENTS.md`.
- Consequence: The repository root remains uncluttered and the workflow has a single, documented location.
