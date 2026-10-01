---
description: Abrir o dia: continuidade e trabalho liberado
---

**CV-BOMDIA-001** · `/bomdia` — abrir o dia, validar continuidade e mostrar trabalho liberado (índice: `${CLAUDE_PLUGIN_ROOT}/references/cmd-cop-index.md`).

1. **Pré-voo de dependências:** aplicar `${CLAUDE_PLUGIN_ROOT}/references/nucleo-dependencias.md` antes de agir — confirmar o último fechamento, o objeto atual e os bloqueios ativos; só mostrar como liberado o que não tem dependência bloqueante pendente.
2. **Delegar:** usar a skill `copiloto-executar` (em algumas superfícies, `anthropic-skills:copiloto-executar`) com `$ARGUMENTS`. Se a skill não estiver disponível nesta sessão, responder `bloqueado-externo` nomeando a skill ausente, sem simular o resultado.
3. Produzir uma ação principal, não um relatório geral. Se houver ambiguidade material entre dois objetos, pedir a decisão mínima. Responder em pt-BR e fechar com `Dependências de entrada → Saída → Gate`.
