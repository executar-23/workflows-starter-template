---
description: Revisar métricas com tendência e ações
argument-hint: "<período ou métrica>"
---

**CV-METRICA-001** · `/metricas` — revisar métricas de produto com tendência e ações (índice: `${CLAUDE_PLUGIN_ROOT}/references/cmd-cop-index.md`).

1. **Pré-voo de dependências:** aplicar `${CLAUDE_PLUGIN_ROOT}/references/nucleo-dependencias.md` antes de agir, declarando o resultado antes de procurar entradas.
2. **Delegar:** usar a skill `executar-cop:metrics-review` com `$ARGUMENTS`. Skill interna deste plugin (origem: Anthropic, Apache-2.0).
3. **Saída visual:** aplicar `${CLAUDE_PLUGIN_ROOT}/assets/design-tokens/calendario-light-mode.md` (vermelho só para hoje, prioridade ou atual).
4. **Busca web:** obrigatória quando tocar fato externo; citar a fonte.
5. Produzir uma ação principal, não um relatório geral. Se houver ambiguidade material, pedir a decisão mínima. Responder em pt-BR e fechar com `Dependências de entrada → Saída → Gate`.
