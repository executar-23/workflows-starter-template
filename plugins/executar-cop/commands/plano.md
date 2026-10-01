---
description: Plano de execução rastreável
argument-hint: "<prompt ou objetivo>"
---

**CV-PLANO-001** · `/plano` — transformar prompt bruto em plano de execução rastreável antes de implementar (índice: `${CLAUDE_PLUGIN_ROOT}/references/cmd-cop-index.md`).

1. **Pré-voo de dependências:** aplicar `${CLAUDE_PLUGIN_ROOT}/references/nucleo-dependencias.md` antes de agir, declarando o resultado antes de procurar entradas.
2. **Delegar:** usar a skill `executar-cop:executar-plan-mode` com `$ARGUMENTS`. Skill interna deste plugin (skill proprietária do EXECUTAR).
3. Produzir uma ação principal, não um relatório geral. Se houver ambiguidade material, pedir a decisão mínima. Responder em pt-BR e fechar com `Dependências de entrada → Saída → Gate`.
