---
description: Sincronização mínima de tarefas e contexto
---

**CV-ATUAL-001** · `/atualizar` — sincronização mínima de tarefas e contexto (índice: `${CLAUDE_PLUGIN_ROOT}/references/cmd-cop-index.md`).

1. **Pré-voo de dependências:** aplicar `${CLAUDE_PLUGIN_ROOT}/references/nucleo-dependencias.md` antes de agir — sincronizar só o necessário ao objeto atual e às suas entradas; se `TASKS.md`/`memory/` não existirem, rodar antes a skill `executar-cop:start` (DEP-COP-005).
2. **Delegar:** usar a skill `executar-cop:update` com `$ARGUMENTS`. Skill interna deste plugin (origem: productivity, Anthropic, Apache-2.0).
3. Produzir uma ação principal, não um relatório geral. Se houver ambiguidade material entre dois objetos, pedir a decisão mínima. Responder em pt-BR e fechar com `Dependências de entrada → Saída → Gate`.
