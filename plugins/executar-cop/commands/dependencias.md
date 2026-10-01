---
description: Reconstruir dependências do Control Plane
argument-hint: "<caminho da planilha .xlsx>"
---

**CV-DEPEND-001** · `/dependencias` — reconstruir a rede de dependências do Control Plane e entregar 16_REG, mapa e arquitetura de preenchimento (índice: `${CLAUDE_PLUGIN_ROOT}/references/cmd-cop-index.md`).

1. **Pré-voo de dependências:** aplicar `${CLAUDE_PLUGIN_ROOT}/references/nucleo-dependencias.md` antes de agir — a planilha `EXECUTAR_HUB_Control_Plane_v2.xlsx` é a entrada bloqueante; sem ela, a situação é `bloqueado-externo` e o arquivo deve ser pedido.
2. **Delegar:** usar a skill `executar-cop:executar-dependency-architect` com `$ARGUMENTS`. Skill interna deste plugin.
3. **Busca web:** obrigatória quando a análise depender de referência externa (gestão de programas, desenho de Gates, normas citadas); citar a fonte.
4. Produzir uma ação principal, não um relatório geral. Se houver ambiguidade material entre dois objetos, pedir a decisão mínima. Responder em pt-BR e fechar com `Dependências de entrada → Saída → Gate`.
