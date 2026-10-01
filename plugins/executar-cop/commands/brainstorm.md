---
description: Brainstorm de produto com parceiro crítico
argument-hint: "<tema, problema ou ideia>"
---

**CV-IDEIA-001** · `/brainstorm` — explorar ideia, problema ou questão de produto como parceiro de pensamento (índice: `${CLAUDE_PLUGIN_ROOT}/references/cmd-cop-index.md`).

1. **Pré-voo de dependências:** aplicar `${CLAUDE_PLUGIN_ROOT}/references/nucleo-dependencias.md` antes de agir, declarando o resultado antes de procurar entradas.
2. **Delegar:** usar a skill `executar-cop:product-brainstorming` com `$ARGUMENTS`. Skill interna deste plugin (origem: Anthropic, Apache-2.0).
3. **Busca web:** obrigatória quando tocar fato externo; citar a fonte.
4. Produzir uma ação principal, não um relatório geral. Se houver ambiguidade material, pedir a decisão mínima. Responder em pt-BR e fechar com `Dependências de entrada → Saída → Gate`.
