---
name: cadeia-valor-unica
description: "Cadeia de Valor Única do Programa EXECUTAR: recebe um process doc (docx/md, ex.: AIKB-0001 PD-CLB) e, numa só cadeia de análise com a Estratégia 07 + agent-handoff, unifica dependency architecture, process optimization, árvore roadmap, árvore visual e runbook. Entrega 5 artefatos: (1) árvore roadmap, (2) árvore visual, (3) working process publicado e executável no Worker Cloudflare (schema workflow.json), (4) relatório único (dependências + otimização + PDF do workflow), (5) runbook MD tabular. Use quando o usuário pedir cadeia única, /cadeia-unica, CV-CADEIA-001, transformar process doc em workflow, ou unificar dependências/otimização/árvores/runbook."
---

# Cadeia de Valor Única (CV-CADEIA-001)

Uma passada única, WIP = 1, de um process doc até um working process executável. Toda saída
deriva da etapa anterior. Não existe artefato solto.

```text
process doc ─► 01 Ingestão ─► 02 Dependências ─► 03 Otimização ─► 04 Árvore roadmap
                                                                     │
          07 Relatório único + Runbook ◄─ 06 Working process ◄─ 05 Árvore visual
```

## Regras transversais (Estratégia 07 + núcleo de dependências)

1. **Estado único.** `out/cadeia/<slug>/ESTADO.md` tem uma linha por etapa, com status
   (⬜ pendente · 🔄 em execução · ✅ concluído · ⛔ bloqueado), dono e evidência. Não existe
   segundo arquivo de estado.
2. **WIP = 1.** Só uma etapa fica 🔄 por vez. Atualize o ESTADO antes de passar à próxima.
3. **✅ exige evidência.** Saída mais validador PASS mais critério satisfeito. Declarar pronto
   não basta.
4. **Não inventar.** Dado ausente vira `A DEFINIR` (GAP). Se bloquear, faça no máximo 3 perguntas
   por rodada. Divergência entre fontes vira `CONFLICT` com as duas fontes citadas. Não se escolhe
   em silêncio.
5. **Tags epistêmicas** em toda dependência e mudança:
   - `DIRECT`: cita a fonte;
   - `DERIVED`: justificativa rastreável;
   - `PROPOSED`: precisa de validação humana;
   - `CONFLICT`;
   - `GAP`.
6. **Posição na árvore não é dependência.** A hierarquia diz onde o item mora. As arestas dizem
   o que precisa acontecer antes.
7. **Otimização nunca remove dependência real.** `mandatory: true` só sai com decisão humana
   registrada.
8. **Ação externa exige aprovação explícita:** publicar o working process, iniciar run, deploy,
   push ou enviar.
9. **Handoff.** Mudança de código no repo segue `/plan → /execute → /verify` (`.handoff/`). A
   cadeia em si é conteúdo e vive em `out/cadeia/<slug>/`.
10. **Respostas em pt-BR.** Toda etapa fecha com `Dependências de entrada → Saída → Gate`.

Contratos completos dos arquivos: `references/contratos.md`. Estratégia 07 original:
`references/estrategia-07.md`. Núcleo de dependências: `references/nucleo-dependencias.md`.

Ferramentas, numa sessão Claude Code com o repo:
- `python3 .claude/skills/cadeia-valor-unica/scripts/<script>.py`;
- `node .claude/skills/executar-flow/scripts/flow.mjs def-*`.

No claude.ai, use o conector MCP `executar` (`/mcp`), com as mesmas operações:
`cadeia_prompt`, `process_doc_ingest`, `workflow_validate`, `workflow_upload`, `artifacts_put`,
`report_pdf_url` e `workflow_start`.

## Etapa 01 · Ingestão

- **OBJECTIVE:** process doc legível e íntegro em Markdown, com as tabelas preservadas.
- **INPUT:** arquivo `.docx` ou `.md` do usuário e um `slug`, que é o código do doc em minúsculas, por exemplo `pd-clb-20260906-f01`.
- **CONSTRAINTS:** não resumir nem reescrever. Só converter e indexar.
- **EXECUTION:** `python3 scripts/docx_to_md.py <doc.docx> out/cadeia/<slug>/fonte.md`. Registrar no ESTADO o índice de tabelas e o código/versão do doc.
- **OUTPUT CONTRACT:** `fonte.md` mais índice (tabela N → linhas × colunas → cabeçalho).
- **VALIDATION:** toda tabela do doc aparece no índice. A tabela de tarefas (ex.: 8.2) e a de fases (ex.: 8.1) estão identificadas.
- **STOP:** doc ilegível, ou sem lista de tarefas/fases. Perguntar.

## Etapa 02 · Arquitetura de dependências

- **OBJECTIVE:** DAG real da cadeia, separando dependências bloqueantes das informativas.
- **INPUT:** `fonte.md`.
- **CONSTRAINTS:**
  - cada aresta lê "target depende de source";
  - `mandatory: true` só com base no doc (`DIRECT`) ou em fluxo de informação rastreável (`DERIVED`);
  - a ordem numérica da lista não é dependência por si só; o máximo que ela dá é `PROPOSED`;
  - detectar ciclos.
- **EXECUTION:**
  1. Cada tarefa vira um nó com ID estável (`T01`…`Tnn`). Fases, gates e handoffs também viram nós.
  2. Para cada par, perguntar: "o target consome a saída do source?" Se sim, é aresta.
  3. Montar as camadas topológicas.
- **OUTPUT CONTRACT:**
  - `mapa-dependencias.json`, com `meta`, `nodes[]` e `edges[]` contendo `dependency_id`, `source`, `target`, `relation`, `mandatory`, `gate_id`, `required_status`, `status`, `motivo`, `impacto`, `tag`, `fonte`;
  - `mapa-dependencias.csv` com as 8 colunas do schema `16_REG_Dependencias`.
- **VALIDATION:** `validar_cadeia.py --etapa 02` dá PASS: refs existem, sem ciclo bloqueante e toda aresta tem tag.
- **STOP:** ciclo bloqueante sem resolução, ou mais da metade das arestas `PROPOSED`. Perguntar ao dono do processo.

## Etapa 03 · Otimização de processo

- **OBJECTIVE:** estado futuro com menos espera, retrabalho e handoff, sem quebrar o DAG.
- **INPUT:** `mapa-dependencias.json` e `fonte.md`.
- **CONSTRAINTS:**
  - desperdícios classificados em `espera`, `retrabalho`, `handoff`, `superprocessamento`, `manual` ou `gargalo`;
  - a espera causada por dependência bloqueante vem em primeiro lugar;
  - é proibido remover uma aresta `mandatory`;
  - paralelizar só tarefas que não dependem entre si;
  - toda mudança leva tag e impacto estimado (estimativa sem dado = `A DEFINIR`).
- **EXECUTION:**
  1. Mapear o estado atual (sequência do doc).
  2. Achar os desperdícios e o caminho crítico.
  3. Propor as mudanças: `paralelizar`, `gate-antecipado`, `automatizar`, `reordenar`, `eliminar-redundancia`.
  4. Chegar ao estado futuro.
- **OUTPUT CONTRACT:** `otimizacao.json` com `estado_atual`, `caminho_critico`, `desperdicios[]`, `mudancas[]` (id, tipo, descricao, afeta[], impacto, tag), `arestas_removidas[]` (só informativas) e `estado_futuro.ordem[]`.
- **VALIDATION:** `validar_cadeia.py --etapa 03`. Nenhuma aresta mandatory removida, e a `ordem` do estado futuro respeita o DAG.
- **STOP:** a otimização exige mudar uma dependência real. Registrar como decisão pendente.

## Etapa 04 · Árvore roadmap

- **OBJECTIVE:** plano navegável no tempo: mês → semana → dia → ciclo M0–M4 → tarefa → dependência → porta → evidência.
- **INPUT:** estado futuro (etapa 03), cadência do doc (ex.: ciclo de 15 dias) e a data de início informada (se ausente: `A DEFINIR`, e o calendário usa a sequência D01…D15).
- **CONSTRAINTS:**
  - schema canônico em `references/contratos.md` §04 (igual ao `executar-arvore-roadmap`);
  - IDs das tarefas iguais aos da etapa 02;
  - `depende_de` só com arestas mandatory;
  - `porta` = gate da etapa 02.
- **EXECUTION:** distribuir as tarefas nos dias pela ordem do estado futuro e pela carga. Rodar `python3 scripts/vendor/validate_structure.py estrutura.json` e depois `python3 scripts/vendor/render_tree_txt.py estrutura.json arvore-roadmap.txt`.
- **OUTPUT CONTRACT:** `estrutura.json` e `arvore-roadmap.txt`.
- **VALIDATION:** o validador vendorizado sai com código 0, e `validar_cadeia.py --etapa 04` confirma que o conjunto de IDs bate com o mapa.
- **STOP:** carga diária impossível dentro do prazo. Registrar o risco e perguntar.

## Etapa 05 · Árvore visual

- **OBJECTIVE:** navegação progressiva todo → ramo → subramo → nó → ação/evidência.
- **INPUT:** `estrutura.json`, `mapa-dependencias.json` e `otimizacao.json`.
- **CONSTRAINTS:**
  - tipos `pasta|arquivo|porta|evidencia|referencia|destino`;
  - estados só com base na fonte;
  - `dependeDe`/`desbloqueia` simétricos e iguais às arestas mandatory;
  - o vermelho do token visual fica só para o nó atual.
- **EXECUTION:** raiz = processo. Ramos:
  - fases;
  - tarefas por fase;
  - portas;
  - nós críticos (caminho crítico e dependências externas);
  - otimizações.

  Gerar o HTML com `python3 scripts/render_arvore_visual.py arvore-visual.json arvore-visual.html`.
- **OUTPUT CONTRACT:** `arvore-visual.json` (schema do componente Executar · Árvore Visual v1.0) e `arvore-visual.html`.
- **VALIDATION:** `validar_cadeia.py --etapa 05`: IDs únicos, simetria dependeDe ↔ desbloqueia, refs existentes.
- **STOP:** não há.

## Etapa 06 · Working process (Cloudflare)

- **OBJECTIVE:** o estado futuro como `WorkflowDefinition` executável no Worker. É o fluxograma START → Steps → END, publicado e validado no Cloudflare.
- **INPUT:** `otimizacao.json` (ordem futura), `mapa-dependencias.json` e `estrutura.json`.
- **CONSTRAINTS:** schema de `workflow.json` (`shared/schema.ts`), detalhado em `references/contratos.md` §06.
  - **Ordem:** ordem topológica no array; `nodes[0]` = start e o último = end.
  - **Forma série-paralela:** cada nó tem 1 dependência e 1 sucessor. Ramos só entre `parallel-split` e `parallel-join`, sem split aninhado.
  - **Paralelizar:** só ramos lineares que o mapa prova independentes.
  - **Tarefas:** viram `activity`, com `executor` `human` (padrão), `verify` (entregável) ou `agent:*` existente. `output` = entregável/DoD.
  - **Gates:** `decision: "human"` + `event`, com `onReject.target` sempre para trás.
  - **Fases futuras sem detalhe:** `subprocess` com nota `A DEFINIR`.
  - **ID da definição:** `^[a-z0-9][a-z0-9-]{2,63}$` (use o slug).
- **EXECUTION:**
  1. Montar `workflow-<slug>.json`.
  2. Rodar `flow.mjs def-validate workflow-<slug>.json --edges mapa-dependencias.json`, que exige PASS sem arestas violadas.
  3. **Com aprovação:** `flow.mjs def-upload …`.
  4. `flow.mjs def-put <slug> <arquivo>` para cada artefato.
  5. PDF: `node scripts/print-pdf.mjs <slug>` (Playwright), ou abrir a `printUrl` e Imprimir → Salvar como PDF.
- **OUTPUT CONTRACT:** `workflow-<slug>.json`, `workflow-<slug>.pdf` e a resposta do upload (revision, url, printUrl) registrada no ESTADO.
- **VALIDATION:**
  - `def-validate` OK;
  - `validar_cadeia.py --etapa 06`: todo nó-tarefa do mapa existe na definição e toda aresta mandatory é respeitada;
  - a página `?def=<slug>` abre o fluxograma.
- **STOP:** sem aprovação para publicar. Entregar o JSON validado localmente e parar.

## Etapa 07 · Relatório único + Runbook

- **OBJECTIVE:** um documento de decisão e um documento de operação.
- **INPUT:** todos os artefatos anteriores.
- **CONSTRAINTS:** relatório e runbook só citam o que existe nos artefatos. Nada novo nasce aqui.
- **EXECUTION:**
  - `relatorio-cadeia.md`, nesta ordem:
    1. Sumário executivo;
    2. Mapa de dependências (registro com 8 colunas, mapa origem→destino→motivo→gate→impacto, camadas topológicas, ciclos);
    3. Otimização de processo (estado atual → desperdícios → estado futuro → impacto);
    4. Working process (link da UI, link do PDF, revisão/sha);
    5. Lacunas e conflitos;
    6. Fechamento `Dependências de entrada → Saída → Gate`.
  - `runbook.md` tabular. Colunas: passo, ID, tarefa, entrada, executor, procedimento, DoD, evidência, gate, rollback/se falhar. Uma linha por nó de trabalho da definição, mais pré-requisitos e escalonamento.
- **OUTPUT CONTRACT:** `relatorio-cadeia.md` e `runbook.md`, enviados com `def-put` junto com todos os artefatos e o PDF.
- **VALIDATION:** `validar_cadeia.py out/cadeia/<slug> --etapa all` dá PASS.
- **STOP:** validador FAIL duas vezes seguidas na mesma etapa. Parar e reportar.

## Saída final ao usuário

1. Os 5 artefatos (caminhos locais e chaves `cadeia/<slug>/…`).
2. URL do fluxograma (`/?def=<slug>`) e do PDF.
3. GAPs e CONFLICTs.
4. Próximo nó elegível, por exemplo "iniciar run com aprovação".
