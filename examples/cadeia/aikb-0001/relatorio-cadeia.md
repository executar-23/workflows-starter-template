# Relatório único · Cadeia de Valor Única · pd-clb-20260906-f01

> Fonte: AIKB-0001 · PD-CLB-20260906-F01-DOC-V01 (Process Doc Creator-Led Growth multiplataforma, rascunho de pré-produção, 06/09/2026). Gerado pela `cadeia-valor-unica` em 01/10/2026. Tags: DIRECT (fonte citada) · DERIVED (rastreável) · PROPOSED (validar) · GAP · CONFLICT.

## Sumário executivo

- **Escopo:** Fase 1 (Produção) do ciclo editorial de 15 dias: 22 tarefas (Tabela 8.2) + Fases 2–5 (Tabela 8.1) como subprocessos `A DEFINIR`.
- **Dependências:** 39 arestas (36 bloqueantes, 3 informativas), sem ciclo bloqueante; tags DERIVED 22, DIRECT 14, PROPOSED 3.
- **Otimização:** caminho sequencial de **22 → 15 casas** (−32%, premissa de casas equivalentes) com 2 paralelizações (M01 ebooks ∥ peça-mãe; M02 sete derivados em paralelo) e 3 propostas (M03 gate antecipado, M04 nomenclatura automatizada, M05 template único de briefing). Nenhuma dependência bloqueante removida.
- **Working process:** `pd-clb-20260906-f01` r1, 32 nós (START → 22 casas + 2 blocos paralelos + gate T21 com retorno a T06 → Fases 2–5 → END), validado pelo servidor (`def-validate`: 0 erros, 0 arestas violadas).
- **Decisão pedida:** data de início do ciclo (roadmap usa 05/10/2026 como referência PROPOSED) e T08 em paralelo com T05–T07 (ver Lacunas).

## Mapa de dependências

Leitura: *target depende de source*. Registro no schema `16_REG_Dependencias` (8 colunas) em `mapa-dependencias.csv`; abaixo, a cadeia origem → destino → motivo → gate → impacto.

| ID | Origem | → Destino | Motivo | Gate | Impacto se faltar | Tag | Bloqueante? |
|---|---|---|---|---|---|---|---|
| DEP-0001 | T01 | T02 | a pesquisa sustenta os claims do tema validado | gate:tbd | pesquisa sem foco; evidência descartada | DERIVED | sim |
| DEP-0002 | T02 | T03 | título de trabalho e CTA dependem dos claims sustentados | gate:tbd | Topic Pack sem lastro (viola 'zero coach') | DERIVED | sim |
| DEP-0003 | T03 | T04 | o outline parte do título, CTA e ferramenta do Topic Pack | gate:tbd | outline sem CTA/ferramenta | DERIVED | sim |
| DEP-0004 | T02 | T04 | o outline já marca Claim/Evidência por bloco (Tópico 3.2) | gate:tbd | blocos sem evidência marcada | DERIVED | sim |
| DEP-0005 | T04 | T05 | redação segue o outline em blocos (Tópico 5.2) | gate:tbd | texto fora da estrutura de 11 blocos | DIRECT | sim |
| DEP-0006 | T05 | T06 | a revisão aplica a Tabela 3.1 ao texto final | gate:tbd | revisão de texto inexistente | DIRECT | sim |
| DEP-0007 | T06 | T07 | GEO/SEO reestrutura o texto já aprovado em estilo | gate:tbd | retrabalho de estilo após GEO | DERIVED | sim |
| DEP-0008 | T04 | T08 | o roteiro tem 'blocos espelhando o artigo' | gate:tbd | vídeo desalinhado do artigo | DIRECT | sim |
| DEP-0009 | T07 | T08 | espelhar a versão final (pós-GEO) evita divergência de nomenclatura | gate:tbd | roteiro cita trechos que mudaram no GEO | PROPOSED | sim |
| DEP-0010 | T07 | T09 | marcação 'no artigo' exige o texto final | gate:tbd | trechos-fonte apontam para versão antiga | DIRECT | sim |
| DEP-0011 | T08 | T09 | marcação 'no roteiro do vídeo' exige o roteiro | gate:tbd | derivados de vídeo sem timestamp | DIRECT | sim |
| DEP-0012 | T09 | T10 | 'a partir dos trechos marcados' | gate:tbd | derivado sem trecho-fonte rastreável | DIRECT | sim |
| DEP-0013 | T09 | T11 | cortes do vídeo mãe usam os timestamps marcados | gate:tbd | derivado sem trecho-fonte rastreável | DERIVED | sim |
| DEP-0014 | T09 | T12 | carrosséis são derivados (Tabela 5.1) dos trechos marcados | gate:tbd | derivado sem trecho-fonte rastreável | DERIVED | sim |
| DEP-0015 | T09 | T13 | imagens estáticas são derivados dos trechos marcados | gate:tbd | derivado sem trecho-fonte rastreável | DERIVED | sim |
| DEP-0016 | T09 | T14 | infográficos representam dados marcados como derivado | gate:tbd | derivado sem trecho-fonte rastreável | DERIVED | sim |
| DEP-0017 | T09 | T15 | stories são derivados com CTA do ciclo | gate:tbd | derivado sem trecho-fonte rastreável | DERIVED | sim |
| DEP-0018 | T07 | T16 | newsletters educam a partir da peça-mãe final | gate:tbd | newsletter diverge do artigo | DERIVED | sim |
| DEP-0019 | T09 | T16 | newsletter pode citar trechos marcados | gate:tbd | — | PROPOSED | não |
| DEP-0020 | T03 | T17 | ebooks são 'lead magnets ligados ao CTA do Topic Pack' | gate:tbd | ebook com CTA errado | DIRECT | sim |
| DEP-0021 | T02 | T17 | o ebook aprofunda um recorte com evidências levantadas | gate:tbd | ebook sem lastro | DERIVED | sim |
| DEP-0022 | T10 | T18 | o mapeamento define 'em quais peças' cada CTA aparece: as peças precisam existir | gate:tbd | CTA mapeado em peça inexistente | DERIVED | sim |
| DEP-0023 | T11 | T18 | o mapeamento define 'em quais peças' cada CTA aparece: as peças precisam existir | gate:tbd | CTA mapeado em peça inexistente | DERIVED | sim |
| DEP-0024 | T12 | T18 | o mapeamento define 'em quais peças' cada CTA aparece: as peças precisam existir | gate:tbd | CTA mapeado em peça inexistente | DERIVED | sim |
| DEP-0025 | T13 | T18 | o mapeamento define 'em quais peças' cada CTA aparece: as peças precisam existir | gate:tbd | CTA mapeado em peça inexistente | DERIVED | sim |
| DEP-0026 | T15 | T18 | o mapeamento define 'em quais peças' cada CTA aparece: as peças precisam existir | gate:tbd | CTA mapeado em peça inexistente | DERIVED | sim |
| DEP-0027 | T16 | T18 | o mapeamento define 'em quais peças' cada CTA aparece: as peças precisam existir | gate:tbd | CTA mapeado em peça inexistente | DERIVED | sim |
| DEP-0028 | T17 | T18 | o mapeamento define 'em quais peças' cada CTA aparece: as peças precisam existir | gate:tbd | CTA mapeado em peça inexistente | DERIVED | sim |
| DEP-0029 | T14 | T18 | infográfico pode carregar CTA de ferramenta | gate:tbd | — | PROPOSED | não |
| DEP-0030 | T18 | T19 | a coerência do arco cruza continuidade de nomenclatura e CTA | gate:tbd | CTA incoerente entre artigos do arco | DERIVED | sim |
| DEP-0031 | T19 | T20 | nomenclatura final só após ajustes de coerência | gate:tbd | renomear arquivos duas vezes | DERIVED | sim |
| DEP-0032 | T14 | T20 | indexação de 'todos os arquivos' inclui os briefings | gate:tbd | briefing fora da convenção 9.1 | DERIVED | sim |
| DEP-0033 | T20 | T21 | o checklist confirma a nomenclatura antes do handoff | G-CONFORMIDADE | handoff com arquivos fora do padrão | DIRECT | sim |
| DEP-0034 | T21 | T22 | checklist 'antes de liberar para a Fase 2' | G-HANDOFF-F2 | Fase 2 recebe pacote não conforme | DIRECT | sim |
| DEP-0035 | T22 | F2 | Fase 2 'depende do handoff da Tarefa 22' | G-HANDOFF-F2 | Fase 2 sem briefing técnico | DIRECT | sim |
| DEP-0036 | F2 | F3 | Fase 3 depende da Fase 2 | gate:tbd | — | DIRECT | sim |
| DEP-0037 | F3 | F4 | Fase 4 depende da Fase 3 | gate:tbd | — | DIRECT | sim |
| DEP-0038 | F4 | F5 | Fase 5 depende da Fase 4 | gate:tbd | — | DIRECT | sim |
| DEP-0039 | F5 | T01 | feedback do ciclo alimenta o próximo tema (Tópico 2.2) | gate:tbd | próximo ciclo sem dado de uso | DIRECT | não |

### Camadas topológicas (bloqueantes)

1. T01
2. T02
3. T03
4. T04, T17
5. T05
6. T06
7. T07
8. T08, T16
9. T09
10. T10, T11, T12, T13, T14, T15
11. T18
12. T19
13. T20
14. T21
15. T22
16. F2
17. F3
18. F4
19. F5

### Ciclos e como foram resolvidos

- `F5 → T01` (feedback → próximo tema, Tópico 2.2) fecha o ciclo entre edições: registrado como **informativo** (`mandatory: false`), pois liga o ciclo N ao N+1, não a mesma edição.

## Otimização de processo

**Estado atual:** 22 tarefas em série estrita (ordem da Tabela 8.2), 1 checagem de conformidade no fim (T21).

**Caminho crítico (estado futuro):** T01 → T02 → T03 → T04 → T05 → T06 → T07 → T08 → T09 → T11 → T18 → T19 → T20 → T21 → T22

### Desperdícios

| ID | Tipo | Onde | Descrição | Tag |
|---|---|---|---|---|
| W01 | espera | T17 | Ebooks (T17) esperam toda a peça-mãe e os derivados, mas só dependem do Topic Pack (T03) e das evidências (T02). | DERIVED |
| W02 | gargalo | T10, T11, T12, T13, T14, T15, T16 | Sete derivados em série, embora todos dependam apenas da marcação de trechos (T09) e da peça-mãe final (T07). | DERIVED |
| W03 | retrabalho | T21 | Conformidade (estilo, GEO, marcação, nomenclatura) só é checada em T21: falha tardia reabre o ciclo a partir da revisão. | DERIVED |
| W04 | manual | T20 | Indexação e renomeação de todos os arquivos feitas à mão no fim do ciclo (convenção 9.1 / pastas 9.2). | DERIVED |
| W05 | handoff | T14, T22 | Specs de formato aparecem no briefing dos infográficos (T14) e de novo no pacote de handoff (T22). | PROPOSED |

### Mudanças → estado futuro

| ID | Tipo | Mudança | Afeta | Impacto | Tag | Resolve |
|---|---|---|---|---|---|---|
| M01 | paralelizar | Ramo paralelo: T17 (ebooks) corre junto com a peça-mãe T04→T08, logo após o Topic Pack. | T17, T04, T05, T06, T07, T08 | −1 casa sequencial (T17 sai do caminho crítico); duração em dias A DEFINIR | DERIVED | W01 |
| M02 | paralelizar | Derivados T10–T16 em paralelo entre PS2 e PJ2 (todos dependem só de T09/T07). | T10, T11, T12, T13, T14, T15, T16 | −6 casas sequenciais (7 derivados → 1 bloco); duração em dias A DEFINIR | DERIVED | W02 |
| M03 | gate-antecipado | Aplicar o checklist de estilo (Tabela 3.1) na saída de T06 e a convenção 9.1 na criação de cada arquivo; T21 vira conferência final com retorno a T06. | T06, T20, T21 | menos retrabalho tardio; taxa de reprovação em T21 A DEFINIR | PROPOSED | W03 |
| M04 | automatizar | Gerar nomes `[HUB]-[PILAR]-[AAAAMMDD]-[SEQ]-[TIPO]-V[VERSÃO]__[slug]` e as 10 pastas por script; T20 passa a validar em vez de renomear. | T20 | T20 de manual para verificação; esforço A DEFINIR | PROPOSED | W04 |
| M05 | eliminar-redundancia | Template único de briefing técnico (proporção, duração, texto na tela) preenchido em T11–T14 e apenas consolidado em T22. | T11, T12, T13, T14, T22 | handoff sem redigitação; A DEFINIR | PROPOSED | W05 |

**Estado futuro:** 15 casas sequenciais; blocos paralelos [['T04-T08', 'T17'], ['T10', 'T11', 'T12', 'T13', 'T14', 'T15', 'T16']]. ASSUMPTION: casas de duração equivalente; ganho em dias A DEFINIR (doc não traz duração por tarefa).

Arestas removidas: nenhuma (regra: otimização nunca remove dependência bloqueante).

## Working process

- **Fluxograma (Cloudflare):** https://workflows-starter-template.hub-executar.workers.dev/?def=pd-clb-20260906-f01
- **PDF A4 do workflow:** `workflow-pd-clb-20260906-f01.pdf` (gerado de https://workflows-starter-template.hub-executar.workers.dev/?def=pd-clb-20260906-f01&print=1 com `scripts/print-pdf.mjs`; também em `cadeia/pd-clb-20260906-f01/workflow-pd-clb-20260906-f01.pdf`)
- **Revisão publicada:** r1 · `definitions/pd-clb-20260906-f01/v1-aa664c0c.json` (sha256 aa664c0c…) · imutável; o run fixa esta chave.
- **Execução:** `node .claude/skills/executar-flow/scripts/flow.mjs def-start pd-clb-20260906-f01` ou `workflow_start` no MCP (ação externa: só com aprovação).

| Fase | Casas | Forma |
|---|---|---|
| 1A · Tema e evidências | T01 → T02 → T03 | série |
| 1B · Peça-mãe ∥ ebooks | PS1 → (T04→T05→T06→T07→T08) ∥ T17 → PJ1 | paralelo (M01) |
| 1C · Derivados | T09 → PS2 → T10 ∥ T11 ∥ T12 ∥ T13 ∥ T14 ∥ T15 ∥ T16 → PJ2 | paralelo (M02) |
| 1D · Integração e handoff | T18 → T19 → T20 → **T21 (gate, NÃO → T06)** → T22 | série + gate |
| 2–5 | F2 → F3 → F4 → F5 | subprocessos A DEFINIR |

## Lacunas e conflitos

- **GAP · data de início do ciclo:** ausente no doc; roadmap ancorado em 05/10/2026 (PROPOSED).
- **GAP · duração por tarefa:** ausente; ganhos expressos em casas sequenciais, não em dias.
- **GAP · Fases 2–5:** só descritas em 1 linha (Tabela 8.1) → subprocessos `A DEFINIR`.
- **GAP · executores:** o doc não atribui responsável por tarefa → `human` em todas; T02 pode virar `agent:research` (PROPOSED).
- **Decisão pendente · T08:** roteiro do vídeo pode correr junto com T05–T07 (T04→T08 DIRECT), mas espelhar a versão pós-GEO (T07→T08) é PROPOSED e o motor não suporta split aninhado; mantido em série.
- **Versão do doc:** a entrada é a V01 (06/09); o CMD-COP já cita a V02 (`PD-CLB-20260922-F01-DOC-V02`). Sem conflito de conteúdo detectado nas Tabelas 8.1/8.2 recebidas; reprocessar se a V02 alterar tarefas.
- Nenhum CONFLICT entre fontes.

## Fechamento

`Dependências de entrada` (process doc V01 + Estratégia 07 + núcleo de dependências) → `Saída` (5 artefatos: árvore roadmap, árvore visual, working process + PDF, este relatório, runbook) → `Gate` (G-CONFORMIDADE em T21; publicação/execução só com aprovação).
