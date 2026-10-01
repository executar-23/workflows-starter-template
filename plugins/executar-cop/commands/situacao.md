---
description: Situação operacional compacta
argument-hint: "[escopo]"
---

**CV-SIT-001** · `/situacao` — emitir situação operacional compacta (índice: `${CLAUDE_PLUGIN_ROOT}/references/cmd-cop-index.md`).

1. **Pré-voo de dependências:** aplicar `${CLAUDE_PLUGIN_ROOT}/references/nucleo-dependencias.md` antes de agir — relatar os bloqueios por Gate e a próxima dependência a destravar.
2. **Delegar:** usar a skill `executar-cop:status-report` com `$ARGUMENTS`. Skill interna deste plugin (origem: operations, Anthropic, Apache-2.0).
3. **Saída visual:** aplicar `${CLAUDE_PLUGIN_ROOT}/assets/design-tokens/calendario-light-mode.md` (paleta, tipografia, vermelho só para hoje, prioridade ou atual).
4. **Busca web:** obrigatória quando comparar com benchmark externo; citar a fonte.
5. Produzir uma ação principal, não um relatório geral. Se houver ambiguidade material entre dois objetos, pedir a decisão mínima. Responder em pt-BR e fechar com `Dependências de entrada → Saída → Gate`.
