---
name: status-report
description: Generate a status report with KPIs, risks, and action items. Use when writing a weekly or monthly update for leadership, summarizing project health with green/yellow/red status, surfacing risks and decisions that need stakeholder attention, or turning a pile of project tracker activity into a readable narrative.
argument-hint: "[weekly | monthly | quarterly] [project or team]"
user-invocable: false
---

# /status-report

> If you see unfamiliar placeholders or need to check which tools are connected, see [CONNECTORS.md](../../CONNECTORS.md).

Generate a polished status report for leadership or stakeholders. See the **risk-assessment** skill for risk matrix frameworks and severity definitions.

## Usage

```
/status-report $ARGUMENTS
```

## Output

```markdown
## Status Report: [Project/Team] — [Period]
**Author:** [Name] | **Date:** [Date]

### Executive Summary
[3-4 sentence overview — what's on track, what needs attention, key wins]

### Overall Status: 🟢 On Track / 🟡 At Risk / 🔴 Off Track

### Key Metrics
| Metric | Target | Actual | Trend | Status |
|--------|--------|--------|-------|--------|
| [KPI] | [Target] | [Actual] | [up/down/flat] | 🟢/🟡/🔴 |

### Accomplishments This Period
- [Win 1]
- [Win 2]

### In Progress
| Item | Owner | Status | ETA | Notes |
|------|-------|--------|-----|-------|
| [Item] | [Person] | [Status] | [Date] | [Context] |

### Risks and Issues
| Risk/Issue | Impact | Mitigation | Owner |
|------------|--------|------------|-------|
| [Risk] | [Impact] | [What we're doing] | [Who] |

### Decisions Needed
| Decision | Context | Deadline | Recommended Action |
|----------|---------|----------|--------------------|
| [Decision] | [Why it matters] | [When] | [What I recommend] |

### Next Period Priorities
1. [Priority 1]
2. [Priority 2]
3. [Priority 3]
```

## If Connectors Available

If **~~project tracker** is connected:
- Pull project status, completed items, and upcoming milestones automatically
- Identify at-risk items and overdue tasks

If **~~chat** is connected:
- Scan recent team discussions for decisions and blockers to include
- Offer to post the finished report to a channel

If **~~calendar** is connected:
- Reference key meetings and decisions from the reporting period

## Tips

1. **Lead with the headline** — Busy leaders read the first 3 lines. Make them count.
2. **Be honest about risks** — Surfacing issues early builds trust. Surprises erode it.
3. **Make decisions easy** — For each decision needed, provide context and a recommendation.

## Integração executar-cop
_Seção acrescentada por executar-23 em 2026-09-27. O restante deste arquivo é conteúdo original da Anthropic (knowledge-work-plugins), sob licença Apache-2.0; ver `../../THIRD_PARTY_NOTICES.md`._
- **ID verbal:** CV-SIT-001 (`/situacao`). Nó `OPS-STATUS-REPORT` em `../../references/grafo-dependencias.json` (camada 2).
- **Pré-voo de dependências:** aplicar `../../references/nucleo-dependencias.md` antes de agir; relate os bloqueios por Gate e a próxima dependência a destravar. Feche com `Dependências de entrada → Saída → Gate`.
- **Busca web:** obrigatória quando comparar com benchmark externo; verifique e cite a fonte.
- **Saída visual** (gráfico, board, dashboard): aplicar `../../assets/design-tokens/calendario-light-mode.md`, com vermelho só para hoje, prioridade ou item atual.
- **Idioma:** toda saída visível sai em português do Brasil, mesmo que as instruções desta skill estejam em inglês.
