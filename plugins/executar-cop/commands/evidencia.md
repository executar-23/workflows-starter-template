---
description: Consultar ou registrar evidência do objeto atual
argument-hint: "[registrar <link ou descrição>]"
---

**CV-EVID-001** · `/evidencia` — consultar ou registrar evidência do objeto atual (índice: `${CLAUDE_PLUGIN_ROOT}/references/cmd-cop-index.md`).

1. **Pré-voo de dependências:** aplicar `${CLAUDE_PLUGIN_ROOT}/references/nucleo-dependencias.md` antes de agir — a evidência precisa apontar para artefato existente; registrar qual dependência ou Gate ela satisfaz.
2. **Delegar:** usar a skill `copiloto-executar` com `$ARGUMENTS`. Se a skill não estiver disponível nesta sessão, responder `bloqueado-externo` nomeando a skill ausente, sem simular o resultado.
3. Produzir uma ação principal, não um relatório geral. Se houver ambiguidade material entre dois objetos, pedir a decisão mínima. Responder em pt-BR e fechar com `Dependências de entrada → Saída → Gate`.
