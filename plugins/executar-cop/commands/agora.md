---
description: Objeto atual: duração, DoD, evidência e próxima ação
---

**CV-AGORA-001** · `/agora` — mostrar somente o objeto atual, duração, DoD, evidência e próxima ação (índice: `${CLAUDE_PLUGIN_ROOT}/references/cmd-cop-index.md`).

1. **Pré-voo de dependências:** aplicar `${CLAUDE_PLUGIN_ROOT}/references/nucleo-dependencias.md` antes de agir — verificar as dependências de entrada do objeto atual; se houver bloqueante pendente, mostrar o bloqueio e o que precisa existir primeiro, em vez do objeto.
2. **Delegar:** usar a skill `copiloto-executar` com `$ARGUMENTS`. Se a skill não estiver disponível nesta sessão, responder `bloqueado-externo` nomeando a skill ausente, sem simular o resultado.
3. Produzir uma ação principal, não um relatório geral. Se houver ambiguidade material entre dois objetos, pedir a decisão mínima. Responder em pt-BR e fechar com `Dependências de entrada → Saída → Gate`.
