---
description: Atualizar ou repriorizar o roadmap de produto
argument-hint: "<mudança ou iniciativa>"
---

**CV-ROADMAP-001** · `/roadmap` — atualizar, criar ou repriorizar o roadmap de produto (índice: `${CLAUDE_PLUGIN_ROOT}/references/cmd-cop-index.md`).

1. **Pré-voo de dependências:** aplicar `${CLAUDE_PLUGIN_ROOT}/references/nucleo-dependencias.md` antes de agir — iniciativas se ordenam por dependência real e pelos Gates, não por data desejada; declarar o que cada item desbloqueia.
2. **Delegar:** usar a skill `executar-cop:roadmap-update` com `$ARGUMENTS`. Skill interna deste plugin (origem: product-management, Anthropic, Apache-2.0).
3. **Saída visual:** aplicar `${CLAUDE_PLUGIN_ROOT}/assets/design-tokens/calendario-light-mode.md` (paleta, tipografia, vermelho só para hoje, prioridade ou atual).
4. **Busca web:** obrigatória quando a priorização usar dado de mercado ou concorrência; citar a fonte.
5. Produzir uma ação principal, não um relatório geral. Se houver ambiguidade material entre dois objetos, pedir a decisão mínima. Responder em pt-BR e fechar com `Dependências de entrada → Saída → Gate`.
