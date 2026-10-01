---
description: Produto → código ponta a ponta
argument-hint: "<objetivo, feature, repo, issue ou PR>"
---

**CV-PRODEV-001** · `/produto-codigo` — conduzir produto → código: discovery, arquitetura, fatia vertical, testes e deploy (índice: `${CLAUDE_PLUGIN_ROOT}/references/cmd-cop-index.md`).

1. **Pré-voo de dependências:** aplicar `${CLAUDE_PLUGIN_ROOT}/references/nucleo-dependencias.md` antes de agir, declarando o resultado antes de procurar entradas.
2. **Delegar:** usar a skill `executar-cop:product-code-development` com `$ARGUMENTS`. Skill interna deste plugin (skill proprietária do EXECUTAR).
3. **Busca web:** obrigatória quando tocar fato externo; citar a fonte.
4. Produzir uma ação principal, não um relatório geral. Se houver ambiguidade material, pedir a decisão mínima. Responder em pt-BR e fechar com `Dependências de entrada → Saída → Gate`.
