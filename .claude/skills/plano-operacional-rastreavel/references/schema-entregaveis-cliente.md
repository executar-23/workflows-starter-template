# Schema dos Entregáveis para o Cliente Final (#2, #3, #4)

Estes 3 arquivos derivam do documento interno (Entregável #1) e **removem todo o aparato de rastreabilidade** (IDs internos, tabelas de conflito, disclaimers normativos extensos). Linguagem simples, prática, sem anglicismos de metodologia.

Termos a evitar nos entregáveis do cliente → substituir por:
- "workstream" → "frente de trabalho"
- "sprint" → "ciclo" ou "semana de trabalho"
- "backlog" → "lista de tarefas" ou "fila de pendências"
- "stakeholder" → "pessoa envolvida" / "parte interessada"
- "deadline" → "prazo"
- "gate" → "ponto de decisão"
- "KR" / "OKR" → "resultado esperado" / "meta com resultado"

---

## §A — Entregável #2: Roadmap / Plano de Ação (Markdown tabular)

Nome do arquivo: `roadmap-[cliente]-[periodo].md`

Estrutura:

```markdown
# Plano de Ação — [Cliente] — [Período]

## Meta do mês
[1 frase, em linguagem simples, sem jargão]

## Frentes de trabalho do mês
| Frente | O que vamos entregar | Por quê importa |
|---|---|---|

## Cronograma por semana
### Semana de DD/MM a DD/MM
| Tarefa | Responsável | Prazo | Resultado esperado |
|---|---|---|---|

(repetir por semana)

## Pontos de decisão no mês
| Quando | O que precisa ser decidido | Quem decide |
|---|---|---|

## O que fica para depois
| Item | Motivo |
|---|---|
```

Regras:
- Cada linha de tarefa começa com verbo de ação (Definir, Criar, Testar, Publicar, Validar, Revisar...).
- Sem coluna de "fonte", "ID", "classificação de evidência" — isso fica só no documento interno.
- Datas sempre DD/MM/AAAA.
- Se uma informação está em GAP no documento interno, aparecer aqui como "A definir" (nunca inventar).

---

## §B — Entregável #3: Schema de Importação para o Linear

Nome do arquivo: `linear-import-[cliente]-[periodo].md` (ou `.csv` se o cliente pedir CSV puro).

Formato: schema canônico de tarefas definido em `references/schema-csv-tarefas.md`, usando **apenas as colunas 1-22** (nunca 23-25 — essas são internas, ver abaixo). Uma linha = uma tarefa/issue. Apresentar como tabela Markdown (padrão) e, se o cliente pedir CSV, gerar `.csv` com as mesmas 22 colunas, separador vírgula, primeira linha de cabeçalho, RFC 4180.

Regras específicas deste entregável (além das regras gerais de `schema-csv-tarefas.md`):
- **Nunca incluir as colunas 23-25** (`tempo_estimado`, `status`, `fonte_id`) — `fonte_id` em especial é ID interno de rastreabilidade (FACT-XX/DECISION-XX/REQ-XX), proibido em entregável de cliente pela mesma regra que já exclui `SRC-XX`/`CONF-XX`. Se o cliente/usuário operar o próprio fluxo com o vocabulário de status do Registro interno, `tempo_estimado` e `status` podem ser incluídos como exceção explícita — registrar essa exceção como DECISION (DEC-XX), não adotar por padrão.
- **Coluna `prompt_ia_self_contained`:** mandatória (DEC-09, fixada em `schema-csv-tarefas.md`) — incluir sempre, seguindo a estrutura de `prompt-self-contained.md`, mesmo quando o cliente não opere via agente de IA (funciona também como especificação executável não-ambígua para execução manual).
- **`titulo` sempre começa com verbo de ação** (ex.: "Definir o indicador mensal do projeto", não "Indicador mensal").
- **`criterio_smart_*` em português simples** — sem "OKR", "KR", "sprint", "backlog" no texto das células.
- **`prioridade`** em texto (Alta/Média/Baixa), nunca "P0/P1/P2" (jargão interno).
- **`cluster_nome`** usa o nome da frente de trabalho em português simples (ex.: "Produto", "Conteúdo") — pode virar label/etiqueta no Linear.

---

## §C — Entregável #4: Calendário One-Page (HTML paisagem com Gantt)

Nome do arquivo: `calendario-[cliente]-[periodo].html`

Requisitos:
- HTML autocontido (CSS inline/embutido, sem dependências externas), pronto para abrir no navegador e imprimir em **uma única página, orientação paisagem** (`@media print { size: landscape; }`).
- Alta legibilidade: fonte grande o suficiente para leitura rápida, alto contraste, sem poluição visual.
- Estrutura visual: título + período no topo; um Gantt simples (barras horizontais por frente de trabalho, com marcadores de semana ao longo do eixo horizontal) cobrindo todo o período; abaixo, blocos de calendário semana a semana destacando marcos e prazos importantes.
- Usar apenas HTML/CSS (grid ou flexbox para o Gantt) — não depender de bibliotecas JS externas para o gráfico, já que o arquivo precisa funcionar offline/impresso.
- Cores por frente de trabalho, com legenda.
- Rodapé com "Emitido em [data]" e nome do cliente.

Antes de escrever este arquivo, consultar a skill `frontend-design` para diretrizes de tipografia e escolha de cores caso o resultado precise de um acabamento visual mais elaborado.
