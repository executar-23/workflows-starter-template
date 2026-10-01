---
description: Varredura profunda de tarefas (só se necessária)
---

**CV-ATUAL-002** · `/atualizar-abrangente` — varredura profunda somente quando necessária (índice: `${CLAUDE_PLUGIN_ROOT}/references/cmd-cop-index.md`).

1. **Pré-voo de dependências:** aplicar `${CLAUDE_PLUGIN_ROOT}/references/nucleo-dependencias.md` antes de agir — confirmar que a sincronização mínima não basta antes de rodar a varredura profunda; se `TASKS.md`/`memory/` não existirem, rodar antes `executar-cop:start` (DEP-COP-005).
2. **Delegar:** usar a skill `executar-cop:update` com o argumento `--comprehensive` com `$ARGUMENTS`. Skill interna deste plugin (origem: productivity, Anthropic, Apache-2.0).
3. Produzir uma ação principal, não um relatório geral. Se houver ambiguidade material entre dois objetos, pedir a decisão mínima. Responder em pt-BR e fechar com `Dependências de entrada → Saída → Gate`.
