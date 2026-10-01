# AGENTS.md · Executar Plan Mode adapter

## Purpose

Use `executar-plan-mode` whenever a request requires planning before implementation.

## Default state

```text
MODE = PLAN
EXECUTION_APPROVED = false
```

## Workflow

1. Read applicable AGENTS.md / AGENTS.override.md instructions.
2. Map their scope to the target files.
3. Inspect current state.
4. Produce a plan with dependencies, phases, outputs and gates.
5. Include verification commands but do not run implementation during Plan Mode.
6. End with `PLAN_READY`.

## Execution barrier

Do not edit, commit, push, open PR, merge or deploy unless execution has been explicitly authorized.

## Required contract

Use:

`contracts/CODEX-PLAN-MODE.contract.md`
