---
description: Fechar o dia: resultado, evidência e transição
---

**CV-FECHAR-001** · `/fechardia` — validar resultado, evidência, registrar transição e preparar continuidade (índice: `${CLAUDE_PLUGIN_ROOT}/references/cmd-cop-index.md`).

1. **Pré-voo de dependências:** aplicar `${CLAUDE_PLUGIN_ROOT}/references/nucleo-dependencias.md` antes de agir — sem a evidência exigida pelo DoD não há transição; declarar o que o fechamento desbloqueia para amanhã.
2. **Delegar:** usar a skill `copiloto-executar` com `$ARGUMENTS`. Se a skill não estiver disponível nesta sessão, responder `bloqueado-externo` nomeando a skill ausente, sem simular o resultado.
3. Produzir uma ação principal, não um relatório geral. Se houver ambiguidade material entre dois objetos, pedir a decisão mínima. Responder em pt-BR e fechar com `Dependências de entrada → Saída → Gate`.
