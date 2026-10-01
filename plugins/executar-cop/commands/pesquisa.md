---
description: Sintetizar pesquisa com usuários
argument-hint: "<tema ou material>"
---

**CV-PESQ-001** · `/pesquisa` — sintetizar pesquisa com usuários (entrevistas, questionários, feedback) em insights (índice: `${CLAUDE_PLUGIN_ROOT}/references/cmd-cop-index.md`).

1. **Pré-voo de dependências:** aplicar `${CLAUDE_PLUGIN_ROOT}/references/nucleo-dependencias.md` antes de agir — cada insight aponta para a evidência que o sustenta; insight sem evidência vira GAP.
2. **Delegar:** usar a skill `executar-cop:synthesize-research` com `$ARGUMENTS`. Skill interna deste plugin (origem: product-management, Anthropic, Apache-2.0).
3. **Saída visual:** aplicar `${CLAUDE_PLUGIN_ROOT}/assets/design-tokens/calendario-light-mode.md` (paleta, tipografia, vermelho só para hoje, prioridade ou atual).
4. **Busca web:** obrigatória quando cruzar os achados com dado externo; citar a fonte.
5. Produzir uma ação principal, não um relatório geral. Se houver ambiguidade material entre dois objetos, pedir a decisão mínima. Responder em pt-BR e fechar com `Dependências de entrada → Saída → Gate`.
