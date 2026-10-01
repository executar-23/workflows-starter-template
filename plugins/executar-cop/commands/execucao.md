---
description: Workflow multiagente, imagem e redação
argument-hint: "<tarefa>"
---

**CV-TOOLKIT-001** · `/execucao` — orquestrar workflow multiagente, imagem existente ou redação técnica (índice: `${CLAUDE_PLUGIN_ROOT}/references/cmd-cop-index.md`).

1. **Pré-voo de dependências:** aplicar `${CLAUDE_PLUGIN_ROOT}/references/nucleo-dependencias.md` antes de agir, declarando o resultado antes de procurar entradas.
2. **Delegar:** usar a skill `executar-cop:execution-toolkit` com `$ARGUMENTS`. Skill interna deste plugin (skill proprietária do EXECUTAR).
3. **Saída visual:** aplicar `${CLAUDE_PLUGIN_ROOT}/assets/design-tokens/calendario-light-mode.md` (vermelho só para hoje, prioridade ou atual).
4. Produzir uma ação principal, não um relatório geral. Se houver ambiguidade material, pedir a decisão mínima. Responder em pt-BR e fechar com `Dependências de entrada → Saída → Gate`.
