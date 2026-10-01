---
description: Emitir o MAPA-OS visual da fonte canônica
---

**CV-MAPA-001** · `/mapa` — emitir MAPA-OS visual a partir da fonte canônica (índice: `${CLAUDE_PLUGIN_ROOT}/references/cmd-cop-index.md`).

1. **Pré-voo de dependências:** aplicar `${CLAUDE_PLUGIN_ROOT}/references/nucleo-dependencias.md` antes de agir — a fonte canônica é a entrada bloqueante; posição no mapa não é dependência.
2. **Delegar:** usar a skill `executar-mapa-os` (em algumas superfícies, `anthropic-skills:executar-mapa-os`) com `$ARGUMENTS`. Se a skill não estiver disponível nesta sessão, responder `bloqueado-externo` nomeando a skill ausente, sem simular o resultado.
3. **Saída visual:** aplicar `${CLAUDE_PLUGIN_ROOT}/assets/design-tokens/calendario-light-mode.md` (paleta, tipografia, vermelho só para hoje, prioridade ou atual).
4. Produzir uma ação principal, não um relatório geral. Se houver ambiguidade material entre dois objetos, pedir a decisão mínima. Responder em pt-BR e fechar com `Dependências de entrada → Saída → Gate`.
