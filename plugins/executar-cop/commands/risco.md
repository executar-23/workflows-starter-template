---
description: Avaliar risco do objeto atual
argument-hint: "[objeto]"
---

**CV-RISCO-001** · `/risco` — avaliar risco do objeto atual (índice: `${CLAUDE_PLUGIN_ROOT}/references/cmd-cop-index.md`).

1. **Pré-voo de dependências:** aplicar `${CLAUDE_PLUGIN_ROOT}/references/nucleo-dependencias.md` antes de agir — riscos de dependência (cadeia bloqueante, ciclo, externo) entram no registro de riscos.
2. **Delegar:** usar a skill `executar-cop:risk-assessment` com `$ARGUMENTS`. Skill interna deste plugin (origem: operations, Anthropic, Apache-2.0).
3. **Busca web:** obrigatória quando o risco depender de fato externo (regulação, mercado, plataforma); citar a fonte.
4. Produzir uma ação principal, não um relatório geral. Se houver ambiguidade material entre dois objetos, pedir a decisão mínima. Responder em pt-BR e fechar com `Dependências de entrada → Saída → Gate`.
