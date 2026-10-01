---
description: Recalcular só o trecho afetado
argument-hint: "[motivo: dependência, capacidade ou bloqueio]"
---

**CV-REPLAN-001** · `/replanejamento` — recalcular apenas o trecho afetado por dependências, capacidade ou bloqueio (índice: `${CLAUDE_PLUGIN_ROOT}/references/cmd-cop-index.md`).

1. **Pré-voo de dependências:** aplicar `${CLAUDE_PLUGIN_ROOT}/references/nucleo-dependencias.md` antes de agir — partir do nó afetado e recalcular só o que está a jusante no grafo; ramos independentes não mudam; reagrupar pelo princípio de agrupamento, nunca por data.
2. **Delegar:** usar a skill `copiloto-executar` com `$ARGUMENTS`. Se a skill não estiver disponível nesta sessão, responder `bloqueado-externo` nomeando a skill ausente, sem simular o resultado.
3. Produzir uma ação principal, não um relatório geral. Se houver ambiguidade material entre dois objetos, pedir a decisão mínima. Responder em pt-BR e fechar com `Dependências de entrada → Saída → Gate`.
