---
description: Escrever spec/PRD de uma funcionalidade
argument-hint: "<funcionalidade ou problema>"
---

**CV-SPEC-001** · `/spec` — escrever a spec/PRD de uma funcionalidade ou problema (índice: `${CLAUDE_PLUGIN_ROOT}/references/cmd-cop-index.md`).

1. **Pré-voo de dependências:** aplicar `${CLAUDE_PLUGIN_ROOT}/references/nucleo-dependencias.md` antes de agir — incluir uma seção de dependências (entradas, bloqueantes, Gate) e a transição Produto → Engenharia.
2. **Delegar:** usar a skill `executar-cop:write-spec` com `$ARGUMENTS`. Skill interna deste plugin (origem: product-management, Anthropic, Apache-2.0).
3. **Busca web:** obrigatória para referências técnicas ou de mercado citadas na spec; citar a fonte.
4. Produzir uma ação principal, não um relatório geral. Se houver ambiguidade material entre dois objetos, pedir a decisão mínima. Responder em pt-BR e fechar com `Dependências de entrada → Saída → Gate`.
