---
description: Consultar ou atualizar TASKS.md
argument-hint: "[ação e tarefa]"
---

**CV-TAREFAS-001** · `/tarefas` — consultar, adicionar ou concluir tarefas do TASKS.md (índice: `${CLAUDE_PLUGIN_ROOT}/references/cmd-cop-index.md`).

1. **Pré-voo de dependências:** aplicar `${CLAUDE_PLUGIN_ROOT}/references/nucleo-dependencias.md` antes de agir, declarando o resultado antes de procurar entradas.
2. **Delegar:** usar a skill `executar-cop:task-management` com `$ARGUMENTS`. Skill interna deste plugin (origem: Anthropic, Apache-2.0).
3. Produzir uma ação principal, não um relatório geral. Se houver ambiguidade material, pedir a decisão mínima. Responder em pt-BR e fechar com `Dependências de entrada → Saída → Gate`.
