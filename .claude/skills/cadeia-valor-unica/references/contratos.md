# Contratos dos artefatos — Cadeia de Valor Única

Diretório: `out/cadeia/<slug>/`. Depois do upload, cada arquivo fica em `cadeia/<slug>/<arquivo>` no R2.
O verificador é `scripts/validar_cadeia.py <dir> --etapa 02|03|04|05|06|07|all`.

## ESTADO.md (único)

```markdown
# ESTADO · <slug>
| Etapa | Status | Dono | Evidência |
|---|---|---|---|
| 01 Ingestão | ✅ | cadeia-valor-unica | fonte.md (395 linhas, 7 tabelas) |
| 02 Dependências | 🔄 | cadeia-valor-unica | — |
```

Status possíveis: ⬜ pendente · 🔄 em execução · ✅ concluído · ⛔ bloqueado. Abaixo da tabela ficam
**Decisões pendentes**, **GAPs** e **Aprovações** (cada uma com data e quem aprovou).

## §02 · mapa-dependencias.json

```json
{
  "meta": { "slug": "pd-clb-20260906-f01", "fonte": "PD-CLB-20260906-F01-DOC-V01", "gerado_em": "2026-10-01" },
  "nodes": [
    { "id": "T01", "titulo": "Validação do tema do ciclo", "tipo": "tarefa", "fase": "F1", "entregavel": "…" },
    { "id": "G-HANDOFF", "titulo": "Checklist de conformidade", "tipo": "gate" },
    { "id": "F2", "titulo": "Fase 2 — Geração de imagens e vídeos", "tipo": "fase" }
  ],
  "edges": [
    {
      "dependency_id": "DEP-0001", "source": "T01", "target": "T02",
      "relation": "valida-tema-para", "mandatory": true, "gate_id": "gate:tbd",
      "required_status": "concluida", "status": "ativa",
      "motivo": "a pesquisa parte do tema validado", "impacto": "pesquisa sem foco/retrabalho",
      "tag": "DERIVED", "fonte": "Tabela 8.2, linhas 01–02"
    }
  ]
}
```

- `tipo` aceita `tarefa`, `gate`, `fase`, `handoff` ou `externo`.
- `tag` aceita `DIRECT`, `DERIVED`, `PROPOSED`, `CONFLICT` ou `GAP`.
- `mapa-dependencias.csv` traz as 8 colunas, nesta ordem: `dependency_id,source_artifact_id,target_artifact_id,relation,mandatory,gate_id,required_status,status`.

## §03 · otimizacao.json

```json
{
  "estado_atual": { "ordem": ["T01", "T02", "…"], "descricao": "22 tarefas em série" },
  "caminho_critico": ["T01", "T02", "T03", "…"],
  "desperdicios": [
    { "id": "W01", "tipo": "espera", "onde": ["T10", "T11"], "descricao": "…", "tag": "DERIVED" }
  ],
  "mudancas": [
    { "id": "M01", "tipo": "paralelizar", "descricao": "…", "afeta": ["T10", "T11", "T12"],
      "impacto": "−3 dias no ciclo (estimativa)", "tag": "PROPOSED", "resolve": ["W01"] }
  ],
  "arestas_removidas": [],
  "estado_futuro": { "ordem": ["T01", "T02", "…"], "paralelos": [["T10", "T11", "T12", "T13"]] }
}
```

- `desperdicios.tipo` aceita `espera`, `retrabalho`, `handoff`, `superprocessamento`, `manual` ou `gargalo`.
- `mudancas.tipo` aceita `paralelizar`, `gate-antecipado`, `automatizar`, `reordenar` ou `eliminar-redundancia`.
- **`arestas_removidas` nunca contém uma aresta com `mandatory: true`.**
- `estado_futuro.ordem` traz todos os nós-tarefa e precisa respeitar o DAG mandatory.

## §04 · estrutura.json (árvore roadmap)

O schema é o canônico do `executar-arvore-roadmap` (CV-ARVORE-001): `meta`, `fluxos_de_valor[]`,
`portas[]` e `calendario[]`. Cada dia tem `ciclos` M0, M1, M2, M3, M4 e 18H (sempre presentes) e
cada tarefa tem `{id, titulo, peso, depende_de, porta, status, evidencia}`. Os IDs das tarefas são
os mesmos do mapa (§02). A soma dos pesos é igual a `meta.total_peso`. A validação roda com
`scripts/vendor/validate_structure.py`, e a projeção com `scripts/vendor/render_tree_txt.py`, que
gera `arvore-roadmap.txt`.

## §05 · arvore-visual.json

O schema é o do componente **Executar · Árvore Visual v1.0**: um nó raiz recursivo com
`{id, titulo, tipo, estado?, aberto?, nota?, dependeDe?, desbloqueia?, filhos?}`.

- `tipo` aceita `pasta`, `arquivo`, `porta`, `evidencia`, `referencia` ou `destino`.
- `estado` aceita `atual`, `liberado`, `dependencia`, `futuro`, `bloqueado-interno`, `bloqueado-externo` ou `concluido`.
- Os IDs são únicos na árvore inteira, e os nós-tarefa usam os mesmos IDs do mapa.
- Se A tem `desbloqueia: [B]`, então B tem `dependeDe: [A]`, e vice-versa.

O HTML é gerado por `scripts/render_arvore_visual.py`, que injeta o JSON no template.

## §06 · workflow-<slug>.json (working process)

O schema é o mesmo de `workflow.json` / `shared/schema.ts` (`WorkflowDefinition`):

```json
{
  "id": "pd-clb-20260906-f01", "version": 1,
  "program": "PROGRAMA EXECUTAR · CADEIA DE VALOR ÚNICA",
  "title": "…", "subtitle": "…", "source": ["PD-CLB-20260906-F01-DOC-V01"],
  "phases": [{ "id": "f1-01", "number": "01", "name": "Tema e evidências" }],
  "nodes": [
    { "id": "START", "kind": "start", "title": "Início do ciclo", "dependsOn": [] },
    { "id": "T01", "kind": "activity", "title": "Validação do tema do ciclo", "phase": "f1-01",
      "dependsOn": ["START"], "executor": "human", "output": "Tema validado: dor real + encaixe de nicho",
      "ids": ["DEP-0001"], "note": "DoD: …" },
    { "id": "G1", "kind": "gate", "title": "Tema aprovado?", "phase": "f1-01", "dependsOn": ["T01"],
      "decision": "human", "event": "g1-tema", "onReject": { "target": "T01", "label": "Revisar tema" } },
    { "id": "PS1", "kind": "parallel-split", "title": "Derivados em paralelo", "dependsOn": ["…"], "symbol": "+" },
    { "id": "PJ1", "kind": "parallel-join", "title": "Derivados prontos", "dependsOn": ["T10", "T13"], "symbol": "+" },
    { "id": "END", "kind": "end", "title": "Handoff entregue", "dependsOn": ["…"] }
  ]
}
```

Regras de validação, aplicadas por `shared/validate.ts` e pelo `flow.mjs def-validate`:
- IDs dos nós seguem `^[A-Z][A-Z0-9-]{0,15}$`. `dependsOn` só aponta para nós anteriores no array.
- O formato é série-paralelo: um `parallel-join` junta exatamente os finais dos ramos do seu split, e não há split aninhado.
- `executor` aceita `human`, `verify`, `agent:clp`, `agent:research`, `agent:plano-ops` ou `agent:analytics`.
- Um gate `human` exige `event`; um gate `auto` exige `check[]`.
- O limite é de 200 nós e 256 KB.

## §07 · relatorio-cadeia.md e runbook.md

`relatorio-cadeia.md` tem estas seções, nesta ordem e com estes títulos (`##`):
1. `Sumário executivo`
2. `Mapa de dependências`
3. `Otimização de processo`
4. `Working process` (deve citar a URL `?def=` e o PDF)
5. `Lacunas e conflitos`
6. `Fechamento`

`runbook.md` precisa de uma tabela Markdown com as colunas
`| Passo | ID | Tarefa | Entrada | Executor | Procedimento | DoD | Evidência | Gate | Se falhar |`
e de uma linha por nó de trabalho (`activity`, `subprocess`, `platform-distribution` e gates) da definição.
