---
description: Gerar a Árvore Visual (JSON/HTML)
argument-hint: "<plano, estrutura.json ou material>"
---

**CV-VISUAL-001** · `/arvore-visual` — gerar a visualização Executar · Árvore Visual (JSON/HTML) de um plano ou projeto (índice: `${CLAUDE_PLUGIN_ROOT}/references/cmd-cop-index.md`).

1. **Pré-voo de dependências:** aplicar `${CLAUDE_PLUGIN_ROOT}/references/nucleo-dependencias.md` antes de agir — no fluxo proprietário, exigir o `estrutura.json` validado de `/arvore` (DEP-COP-002); posição na árvore não é dependência.
2. **Delegar:** usar a skill `executar-cop:executar-mergulhe` com `$ARGUMENTS`. Skill interna deste plugin.
3. **Saída visual:** aplicar `${CLAUDE_PLUGIN_ROOT}/assets/design-tokens/calendario-light-mode.md` (paleta, tipografia, vermelho só para hoje, prioridade ou atual).
4. **Busca web:** obrigatória quando a estrutura depender de fato externo; citar a fonte.
5. Produzir uma ação principal, não um relatório geral. Se houver ambiguidade material entre dois objetos, pedir a decisão mínima. Responder em pt-BR e fechar com `Dependências de entrada → Saída → Gate`.
