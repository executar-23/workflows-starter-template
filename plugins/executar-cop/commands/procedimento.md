---
description: Criar ou consultar procedimento operacional
argument-hint: "<procedimento>"
---

**CV-POP-001** · `/procedimento` — criar ou consultar procedimento operacional (índice: `${CLAUDE_PLUGIN_ROOT}/references/cmd-cop-index.md`).

1. **Pré-voo de dependências:** aplicar `${CLAUDE_PLUGIN_ROOT}/references/nucleo-dependencias.md` antes de agir — listar os pré-requisitos, que são as dependências bloqueantes, antes dos passos.
2. **Delegar:** usar a skill `executar-cop:runbook` com `$ARGUMENTS`. Skill interna deste plugin (origem: operations, Anthropic, Apache-2.0).
3. **Busca web:** obrigatória para comandos, versões ou documentação de ferramenta externa; citar a fonte.
4. Produzir uma ação principal, não um relatório geral. Se houver ambiguidade material entre dois objetos, pedir a decisão mínima. Responder em pt-BR e fechar com `Dependências de entrada → Saída → Gate`.
