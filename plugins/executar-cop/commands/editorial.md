---
description: Criar, continuar ou empacotar ciclo editorial
argument-hint: "<formulário, job ou pedido de pacote>"
---

**CV-EDITORIAL-001** · `/editorial` — criar, continuar ou empacotar um ciclo editorial faseado no Obsidian (índice: `${CLAUDE_PLUGIN_ROOT}/references/cmd-cop-index.md`).

1. **Pré-voo de dependências:** aplicar `${CLAUDE_PLUGIN_ROOT}/references/nucleo-dependencias.md` antes de agir — no fluxo proprietário, exigir a Árvore Visual (DEP-COP-003); um ciclo avulso usa o próprio formulário; respeitar o DAG de etapas e WIP=1.
2. **Delegar:** usar a skill `executar-cop:obsidian-editorial-pipeline` com `$ARGUMENTS`. Skill interna deste plugin.
3. **Saída visual:** aplicar `${CLAUDE_PLUGIN_ROOT}/assets/design-tokens/calendario-light-mode.md` (paleta, tipografia, vermelho só para hoje, prioridade ou atual).
4. **Busca web:** obrigatória nas etapas de evidências, claims e fontes; citar a fonte e a data de acesso.
5. Produzir uma ação principal, não um relatório geral. Se houver ambiguidade material entre dois objetos, pedir a decisão mínima. Responder em pt-BR e fechar com `Dependências de entrada → Saída → Gate`.
