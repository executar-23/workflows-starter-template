---
description: Converter plano em árvore navegável
argument-hint: "[txt|zip|obsidian|csv|kit] <plano>"
---

**CV-ARVORE-001** · `/arvore` — converter um plano em árvore navegável a partir do estrutura.json (índice: `${CLAUDE_PLUGIN_ROOT}/references/cmd-cop-index.md`).

1. **Pré-voo de dependências:** aplicar `${CLAUDE_PLUGIN_ROOT}/references/nucleo-dependencias.md` antes de agir — no fluxo proprietário (entrada = Control Plane), exigir a Arquitetura de Preenchimento de `/dependencias` (DEP-COP-001); com outra entrada, prosseguir e registrar a origem.
2. **Delegar:** usar a skill `executar-cop:executar-arvore-roadmap` (modos: txt=ARVORE-TXT-01, zip=ARVORE-ZIP-02, obsidian=ARVORE-OBSIDIAN-03, csv=ARVORE-CSV-04, kit=ARVOREKIT) com `$ARGUMENTS`. Skill interna deste plugin.
3. **Busca web:** obrigatória quando o plano citar benchmark, prazo regulatório ou dado externo; citar a fonte.
4. Produzir uma ação principal, não um relatório geral. Se houver ambiguidade material entre dois objetos, pedir a decisão mínima. Responder em pt-BR e fechar com `Dependências de entrada → Saída → Gate`.
