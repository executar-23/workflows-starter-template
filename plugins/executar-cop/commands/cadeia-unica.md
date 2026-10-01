---
description: Cadeia única: process doc → workflow
argument-hint: "<process doc .docx/.md> [slug] [data de início]"
---

**CV-CADEIA-001** · `/cadeia-unica` — unificar dependências, otimização, árvore roadmap, árvore visual e runbook numa cadeia única e publicar o working process no Worker (índice: `${CLAUDE_PLUGIN_ROOT}/references/cmd-cop-index.md`).

1. **Pré-voo de dependências:** aplicar `${CLAUDE_PLUGIN_ROOT}/references/nucleo-dependencias.md` antes de agir. A entrada obrigatória é o process doc. A publicação depende do conector MCP `executar`: se ele estiver ausente, a publicação fica `bloqueado-externo` e os artefatos locais seguem normalmente. Ação externa (publicar ou iniciar run) só acontece com aprovação explícita.
2. **Delegar:** usar o agente `cadeia-valor-unica` com a skill `executar-cop:cadeia-valor-unica`, passando `$ARGUMENTS`. São 7 etapas, WIP = 1, com `ESTADO.md` único.
3. **Saída visual:** a árvore visual e o PDF seguem `${CLAUDE_PLUGIN_ROOT}/assets/design-tokens/calendario-light-mode.md`, com o vermelho só para o nó atual.
4. **Busca web:** obrigatória quando o processo depender de fato externo (regra de plataforma, prazo ou benchmark de impacto). Citar a fonte.
5. Entregar os 5 artefatos (árvore roadmap, árvore visual, working process + PDF, relatório único, runbook). Responder em pt-BR e fechar com `Dependências de entrada → Saída → Gate`.
