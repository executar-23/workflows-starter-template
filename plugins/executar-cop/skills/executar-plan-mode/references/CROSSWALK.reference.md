# Codex × Claude Code · Crosswalk

| Função | Codex | Claude Code | Regra da Skill |
|---|---|---|---|
| Instrução persistente | AGENTS.md | CLAUDE.md | Descobrir antes de planejar |
| Escopo contextual | Hierarquia/path | Projeto/parent/child context | Mapear autoridade |
| Skill modular | Contexto/docs/skills conforme ambiente | SKILL.md + resources | Progressive disclosure |
| Plano | Prompt/issue-style plan | Plan/context-driven workflow | PLAN-MODE-CORE |
| Execução | Após autorização | Após autorização | Nunca inferir |
| Verificação | tests/checks | tests/checks | Gate obrigatório |
| Fontes profundas | docs/system of record | references/resources | Não sobrecarregar entrypoint |
| Estado padrão | PLAN | PLAN | EXECUTION_APPROVED=false |

## Portabilidade

O núcleo do plano deve permanecer neutro.

Somente a camada de adapter deve conhecer convenções específicas do fornecedor.
