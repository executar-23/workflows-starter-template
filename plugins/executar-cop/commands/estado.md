---
description: Progresso, Sprint/C72, Gate e bloqueios
---

**CV-ESTADO-001** · `/estado` — mostrar progresso, Sprint/C72, Gate, bloqueios e estado atual (índice: `${CLAUDE_PLUGIN_ROOT}/references/cmd-cop-index.md`).

1. **Pré-voo de dependências:** aplicar `${CLAUDE_PLUGIN_ROOT}/references/nucleo-dependencias.md` antes de agir — relacionar cada bloqueio ao Gate afetado e classificá-lo como interno ou externo.
2. **Delegar:** usar a skill `copiloto-executar` com `$ARGUMENTS`. Se a skill não estiver disponível nesta sessão, responder `bloqueado-externo` nomeando a skill ausente, sem simular o resultado.
3. Produzir uma ação principal, não um relatório geral. Se houver ambiguidade material entre dois objetos, pedir a decisão mínima. Responder em pt-BR e fechar com `Dependências de entrada → Saída → Gate`.
