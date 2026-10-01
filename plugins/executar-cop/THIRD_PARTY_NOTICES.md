# Avisos de terceiros

## Anthropic — knowledge-work-plugins (Apache License 2.0)
Parte das skills deste plugin vem dos plugins `operations` 1.3.0, `productivity` 1.3.1, `product-management` 1.2.0 e `cowork-plugin-management` 0.2.2 do repositório `anthropics/knowledge-work-plugins`. Copyright Anthropic.

Esse material é licenciado sob a Apache License, Version 2.0, cujo texto integral está em [`LICENSE-APACHE-2.0`](LICENSE-APACHE-2.0). As skills foram incorporadas ao `executar-cop` por decisão do usuário em 2026-09-27; ver [ADR-0003](../../docs/ADR-0003-PLUGIN-EXECUTAR-COP.md), emenda b.

| Origem | Skills incorporadas |
|---|---|
| operations | `capacity-plan`, `change-request`, `process-doc`, `runbook`, `status-report`, `vendor-review`, `risk-assessment`, `compliance-tracking`, `process-optimization` |
| productivity | `update`, `start`, `task-management`, `memory-management`, `skills/dashboard.html` |
| product-management | `roadmap-update`, `write-spec`, `synthesize-research`, `competitive-brief`, `metrics-review`, `product-brainstorming` (+ comando `brainstorm` preservado em `brainstorm-command-original.md`), `sprint-planning`, `stakeholder-update` |
| cowork-plugin-management | `cowork-plugin-customizer`, `create-cowork-plugin` |

**Modificações** (Apache-2.0, §4b; cada arquivo modificado traz aviso próprio):
1. Em cada `SKILL.md` acima, foi acrescentada ao final a seção "Integração executar-cop" (ID verbal, pré-voo de dependências, busca web, idioma e proteção do `CLAUDE.md`). Também foi acrescentado `user-invocable: false` ao frontmatter quando ausente, para que a interface do usuário continue sendo a dos comandos CV. O corpo original não foi alterado.
2. Em `skills/dashboard.html`, a paleta e a tipografia foram migradas para o token do calendário (`assets/design-tokens/calendario-light-mode.md`).
3. O `CONNECTORS.md` na raiz deste plugin une os três `CONNECTORS.md` originais.

Não foram incorporados apenas os `.mcp.json`: os conectores vêm da conta do usuário (ver `CONNECTORS.md`). Todo o resto tem ID verbal (ADR-0003, emenda c).
