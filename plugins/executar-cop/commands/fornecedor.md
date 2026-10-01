---
description: Avaliar fornecedor
argument-hint: "<fornecedor ou proposta>"
---

**CV-FORN-001** · `/fornecedor` — avaliar fornecedor (índice: `${CLAUDE_PLUGIN_ROOT}/references/cmd-cop-index.md`).

1. **Pré-voo de dependências:** aplicar `${CLAUDE_PLUGIN_ROOT}/references/nucleo-dependencias.md` antes de agir — tratar o fornecedor como dependência externa: o que bloqueia e quais ramos seguem independentes.
2. **Delegar:** usar a skill `executar-cop:vendor-review` com `$ARGUMENTS`. Skill interna deste plugin (origem: operations, Anthropic, Apache-2.0).
3. **Busca web:** obrigatória (preços, reputação, termos e alternativas atuais); citar fontes e datas.
4. Produzir uma ação principal, não um relatório geral. Se houver ambiguidade material entre dois objetos, pedir a decisão mínima. Responder em pt-BR e fechar com `Dependências de entrada → Saída → Gate`.
