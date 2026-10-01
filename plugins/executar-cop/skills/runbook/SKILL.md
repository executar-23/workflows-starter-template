---
name: runbook
description: Create or update an operational runbook for a recurring task or procedure. Use when documenting a task that on-call or ops needs to run repeatably, turning tribal knowledge into exact step-by-step commands, adding troubleshooting and rollback steps to an existing procedure, or writing escalation paths for when things go wrong.
argument-hint: "<process or task name>"
user-invocable: false
---

# /runbook

> If you see unfamiliar placeholders or need to check which tools are connected, see [CONNECTORS.md](../../CONNECTORS.md).

Create a step-by-step operational runbook for a recurring task or procedure.

## Usage

```
/runbook $ARGUMENTS
```

## Output

```markdown
## Runbook: [Task Name]
**Owner:** [Team/Person] | **Frequency:** [Daily/Weekly/Monthly/As Needed]
**Last Updated:** [Date] | **Last Run:** [Date]

### Purpose
[What this runbook accomplishes and when to use it]

### Prerequisites
- [ ] [Access or permission needed]
- [ ] [Tool or system required]
- [ ] [Data or input needed]

### Procedure

#### Step 1: [Name]
```
[Exact command, action, or instruction]
```
**Expected result:** [What should happen]
**If it fails:** [What to do]

#### Step 2: [Name]
```
[Exact command, action, or instruction]
```
**Expected result:** [What should happen]
**If it fails:** [What to do]

### Verification
- [ ] [How to confirm the task completed successfully]
- [ ] [What to check]

### Troubleshooting
| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| [What you see] | [Why] | [What to do] |

### Rollback
[How to undo this if something goes wrong]

### Escalation
| Situation | Contact | Method |
|-----------|---------|--------|
| [When to escalate] | [Who] | [How to reach them] |

### History
| Date | Run By | Notes |
|------|--------|-------|
| [Date] | [Person] | [Any issues or observations] |
```

## If Connectors Available

If **~~knowledge base** is connected:
- Search for existing runbooks to update rather than create from scratch
- Publish the completed runbook to your ops wiki

If **~~ITSM** is connected:
- Link the runbook to related incident types and change requests
- Auto-populate escalation contacts from on-call schedules

## Tips

1. **Be painfully specific** — "Run the script" is not a step. "Run `python sync.py --prod --dry-run` from the ops server" is.
2. **Include failure modes** — What can go wrong at each step and what to do about it.
3. **Test the runbook** — Have someone unfamiliar with the process follow it. Fix where they get stuck.

## Integração executar-cop
_Seção acrescentada por executar-23 em 2026-09-27. O restante deste arquivo é conteúdo original da Anthropic (knowledge-work-plugins), sob licença Apache-2.0; ver `../../THIRD_PARTY_NOTICES.md`._
- **ID verbal:** CV-POP-001 (`/procedimento`). Nó `OPS-RUNBOOK` em `../../references/grafo-dependencias.json` (camada 2).
- **Pré-voo de dependências:** aplicar `../../references/nucleo-dependencias.md` antes de agir; liste os pré-requisitos, que são as dependências bloqueantes, antes dos passos. Feche com `Dependências de entrada → Saída → Gate`.
- **Busca web:** obrigatória para comandos, versões ou documentação de ferramenta externa; verifique e cite a fonte.
- **Idioma:** toda saída visível sai em português do Brasil, mesmo que as instruções desta skill estejam em inglês.
