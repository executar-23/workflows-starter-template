---
description: Validar critérios, normas e evidências
argument-hint: "<critério ou norma>"
---

**CV-CONF-001** · `/conformidade` — validar critérios, normas e evidências (índice: `${CLAUDE_PLUGIN_ROOT}/references/cmd-cop-index.md`).

1. **Pré-voo de dependências:** aplicar `${CLAUDE_PLUGIN_ROOT}/references/nucleo-dependencias.md` antes de agir — cada critério aponta para a evidência e o Gate que ele satisfaz; o que falta vira GAP.
2. **Delegar:** usar a skill `executar-cop:compliance-tracking` com `$ARGUMENTS`. Skill interna deste plugin (origem: operations, Anthropic, Apache-2.0).
3. **Busca web:** obrigatória para confirmar a versão vigente de cada norma; citar a fonte.
4. Produzir uma ação principal, não um relatório geral. Se houver ambiguidade material entre dois objetos, pedir a decisão mínima. Responder em pt-BR e fechar com `Dependências de entrada → Saída → Gate`.
