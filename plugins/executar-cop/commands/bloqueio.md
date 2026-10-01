---
description: Registrar ou consultar bloqueios ativos
argument-hint: "[descrição do impedimento]"
---

**CV-BLOQ-001** · `/bloqueio` — registrar impedimento ou consultar bloqueios ativos (índice: `${CLAUDE_PLUGIN_ROOT}/references/cmd-cop-index.md`).

1. **Pré-voo de dependências:** aplicar `${CLAUDE_PLUGIN_ROOT}/references/nucleo-dependencias.md` antes de agir — classificar como `bloqueado-interno` ou `bloqueado-externo` e listar os ramos que continuam livres.
2. **Delegar:** usar a skill `copiloto-executar` com `$ARGUMENTS`. Se a skill não estiver disponível nesta sessão, responder `bloqueado-externo` nomeando a skill ausente, sem simular o resultado.
3. Produzir uma ação principal, não um relatório geral. Se houver ambiguidade material entre dois objetos, pedir a decisão mínima. Responder em pt-BR e fechar com `Dependências de entrada → Saída → Gate`.
