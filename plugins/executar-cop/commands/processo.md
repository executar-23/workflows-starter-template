---
description: Documentar processo (fluxo, RACI, SOP)
argument-hint: "<processo>"
---

**CV-PROC-001** · `/processo` — documentar processo (índice: `${CLAUDE_PLUGIN_ROOT}/references/cmd-cop-index.md`).

1. **Pré-voo de dependências:** aplicar `${CLAUDE_PLUGIN_ROOT}/references/nucleo-dependencias.md` antes de agir — explicitar entradas e saídas de cada etapa; as dependências entre etapas levam tag epistêmica.
2. **Delegar:** usar a skill `executar-cop:process-doc` com `$ARGUMENTS`. Skill interna deste plugin (origem: operations, Anthropic, Apache-2.0).
3. **Saída visual:** aplicar `${CLAUDE_PLUGIN_ROOT}/assets/design-tokens/calendario-light-mode.md` (paleta, tipografia, vermelho só para hoje, prioridade ou atual).
4. **Busca web:** obrigatória quando o processo seguir norma ou prática de referência externa; citar a fonte.
5. Produzir uma ação principal, não um relatório geral. Se houver ambiguidade material entre dois objetos, pedir a decisão mínima. Responder em pt-BR e fechar com `Dependências de entrada → Saída → Gate`.
