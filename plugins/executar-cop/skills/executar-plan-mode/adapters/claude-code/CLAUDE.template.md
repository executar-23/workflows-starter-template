# CLAUDE.md · Executar Plan Mode adapter

## Purpose

Use the `executar-plan-mode` Skill for requests that require structured planning before implementation.

## Default state

```text
MODE = PLAN
EXECUTION_APPROVED = false
```

## Workflow

1. Read applicable CLAUDE.md project context.
2. Load `executar-plan-mode/SKILL.md`.
3. Load only the contracts/references required by the task.
4. Inspect current state.
5. Produce a structured plan with dependencies, outputs, gates and Definition of Done.
6. End with `PLAN_READY`.

## Progressive disclosure

Do not preload every reference. Load supporting files only when relevant.

## Execution barrier

Do not modify the target project unless execution has been explicitly authorized.

## Required contract

Use:

`contracts/CLAUDE-CODE-PLAN-MODE.contract.md`
