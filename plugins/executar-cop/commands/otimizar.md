---
description: Reduzir desperdício, espera e fricção do fluxo
argument-hint: "[fluxo]"
---

**CV-OTIM-001** · `/otimizar` — reduzir desperdício, duplicação, espera e fricção do fluxo atual (índice: `${CLAUDE_PLUGIN_ROOT}/references/cmd-cop-index.md`).

1. **Pré-voo de dependências:** aplicar `${CLAUDE_PLUGIN_ROOT}/references/nucleo-dependencias.md` antes de agir — espera causada por dependência bloqueante é o primeiro alvo; não remover dependência real para ganhar velocidade.
2. **Delegar:** usar a skill `executar-cop:process-optimization` com `$ARGUMENTS`. Skill interna deste plugin (origem: operations, Anthropic, Apache-2.0).
3. **Busca web:** obrigatória quando usar benchmark ou prática de referência externa; citar a fonte.
4. Produzir uma ação principal, não um relatório geral. Se houver ambiguidade material entre dois objetos, pedir a decisão mínima. Responder em pt-BR e fechar com `Dependências de entrada → Saída → Gate`.
