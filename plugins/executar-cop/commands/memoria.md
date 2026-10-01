---
description: Consultar ou ajustar a memória operacional
argument-hint: "[termo ou ajuste]"
---

**CV-MEMORIA-001** · `/memoria` — consultar ou ajustar memória operacional (índice: `${CLAUDE_PLUGIN_ROOT}/references/cmd-cop-index.md`).

1. **Pré-voo de dependências:** aplicar `${CLAUDE_PLUGIN_ROOT}/references/nucleo-dependencias.md` antes de agir — ajustes de memória preservam IDs canônicos; num repositório com `CLAUDE.md` normativo, gravar só em `memory/` e pedir confirmação antes de editar o `CLAUDE.md`.
2. **Delegar:** usar a skill `executar-cop:memory-management` com `$ARGUMENTS`. Skill interna deste plugin (origem: productivity, Anthropic, Apache-2.0).
3. Produzir uma ação principal, não um relatório geral. Se houver ambiguidade material entre dois objetos, pedir a decisão mínima. Responder em pt-BR e fechar com `Dependências de entrada → Saída → Gate`.
