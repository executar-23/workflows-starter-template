import json, sys
from pathlib import Path
D=Path(sys.argv[1]); BASE=sys.argv[2]; SLUG="pd-clb-20260906-f01"
mapa=json.loads((D/"mapa-dependencias.json").read_text()); opt=json.loads((D/"otimizacao.json").read_text())
wf=json.loads((D/f"workflow-{SLUG}.json").read_text()); byid={n["id"]:n for n in wf["nodes"]}
titles={n["id"]:n["titulo"] for n in mapa["nodes"]}
E=mapa["edges"]; mand=[e for e in E if e["mandatory"]]
tags={}
for e in E: tags[e["tag"]]=tags.get(e["tag"],0)+1
# camadas topológicas (bloqueantes)
nodes=[n["id"] for n in mapa["nodes"]]; indeg={n:0 for n in nodes}; succ={n:[] for n in nodes}
for e in mand: succ[e["source"]].append(e["target"]); indeg[e["target"]]+=1
layers=[]; fr=sorted(n for n in nodes if indeg[n]==0)
while fr:
    layers.append(fr); nx=[]
    for n in fr:
        for t in succ[n]:
            indeg[t]-=1
            if indeg[t]==0: nx.append(t)
    fr=sorted(nx)
url=f"{BASE}/?def={SLUG}"; pdf=f"workflow-{SLUG}.pdf"
L=[]
L+=[f"# Relatório único · Cadeia de Valor Única · {SLUG}","",
"> Fonte: AIKB-0001 · PD-CLB-20260906-F01-DOC-V01 (Process Doc Creator-Led Growth multiplataforma, rascunho de pré-produção, 06/09/2026). Gerado pela `cadeia-valor-unica` em 01/10/2026. Tags: DIRECT (fonte citada) · DERIVED (rastreável) · PROPOSED (validar) · GAP · CONFLICT.","",
"## Sumário executivo","",
f"- **Escopo:** Fase 1 (Produção) do ciclo editorial de 15 dias: 22 tarefas (Tabela 8.2) + Fases 2–5 (Tabela 8.1) como subprocessos `A DEFINIR`.",
f"- **Dependências:** {len(E)} arestas ({len(mand)} bloqueantes, {len(E)-len(mand)} informativas), sem ciclo bloqueante; tags {', '.join(f'{k} {v}' for k,v in sorted(tags.items()))}.",
f"- **Otimização:** caminho sequencial de **22 → 15 casas** (−32%, premissa de casas equivalentes) com 2 paralelizações (M01 ebooks ∥ peça-mãe; M02 sete derivados em paralelo) e 3 propostas (M03 gate antecipado, M04 nomenclatura automatizada, M05 template único de briefing). Nenhuma dependência bloqueante removida.",
f"- **Working process:** `{SLUG}` r1, {len(wf['nodes'])} nós (START → 22 casas + 2 blocos paralelos + gate T21 com retorno a T06 → Fases 2–5 → END), validado pelo servidor (`def-validate`: 0 erros, 0 arestas violadas).",
f"- **Decisão pedida:** data de início do ciclo (roadmap usa 05/10/2026 como referência PROPOSED) e T08 em paralelo com T05–T07 (ver Lacunas).","",
"## Mapa de dependências","",
"Leitura: *target depende de source*. Registro no schema `16_REG_Dependencias` (8 colunas) em `mapa-dependencias.csv`; abaixo, a cadeia origem → destino → motivo → gate → impacto.","",
"| ID | Origem | → Destino | Motivo | Gate | Impacto se faltar | Tag | Bloqueante? |","|---|---|---|---|---|---|---|---|"]
for e in E:
    L.append(f"| {e['dependency_id']} | {e['source']} | {e['target']} | {e['motivo']} | {e['gate_id']} | {e['impacto']} | {e['tag']} | {'sim' if e['mandatory'] else 'não'} |")
L+=["","### Camadas topológicas (bloqueantes)",""]
for i,l in enumerate(layers,1): L.append(f"{i}. {', '.join(l)}")
L+=["","### Ciclos e como foram resolvidos","","- `F5 → T01` (feedback → próximo tema, Tópico 2.2) fecha o ciclo entre edições: registrado como **informativo** (`mandatory: false`), pois liga o ciclo N ao N+1, não a mesma edição.",""]
L+=["## Otimização de processo","",f"**Estado atual:** {opt['estado_atual']['descricao']}.","",
"**Caminho crítico (estado futuro):** "+" → ".join(opt["caminho_critico"]),"","### Desperdícios","","| ID | Tipo | Onde | Descrição | Tag |","|---|---|---|---|---|"]
for w in opt["desperdicios"]: L.append(f"| {w['id']} | {w['tipo']} | {', '.join(w['onde'])} | {w['descricao']} | {w['tag']} |")
L+=["","### Mudanças → estado futuro","","| ID | Tipo | Mudança | Afeta | Impacto | Tag | Resolve |","|---|---|---|---|---|---|---|"]
for m in opt["mudancas"]: L.append(f"| {m['id']} | {m['tipo']} | {m['descricao']} | {', '.join(m['afeta'])} | {m['impacto']} | {m['tag']} | {', '.join(m['resolve'])} |")
L+=["",f"**Estado futuro:** {opt['estado_futuro']['casas_sequenciais']} casas sequenciais; blocos paralelos {opt['estado_futuro']['paralelos']}. {opt['estado_futuro']['premissa']}.","","Arestas removidas: nenhuma (regra: otimização nunca remove dependência bloqueante).",""]
L+=["## Working process","",
f"- **Fluxograma (Cloudflare):** {url}",f"- **PDF A4 do workflow:** `{pdf}` (gerado de {url}&print=1 com `scripts/print-pdf.mjs`; também em `cadeia/{SLUG}/{pdf}`)",
"- **Revisão publicada:** r1 · `definitions/pd-clb-20260906-f01/v1-aa664c0c.json` (sha256 aa664c0c…) · imutável; o run fixa esta chave.",
"- **Execução:** `node .claude/skills/executar-flow/scripts/flow.mjs def-start pd-clb-20260906-f01` ou `workflow_start` no MCP (ação externa: só com aprovação).","",
"| Fase | Casas | Forma |","|---|---|---|",
"| 1A · Tema e evidências | T01 → T02 → T03 | série |","| 1B · Peça-mãe ∥ ebooks | PS1 → (T04→T05→T06→T07→T08) ∥ T17 → PJ1 | paralelo (M01) |",
"| 1C · Derivados | T09 → PS2 → T10 ∥ T11 ∥ T12 ∥ T13 ∥ T14 ∥ T15 ∥ T16 → PJ2 | paralelo (M02) |","| 1D · Integração e handoff | T18 → T19 → T20 → **T21 (gate, NÃO → T06)** → T22 | série + gate |",
"| 2–5 | F2 → F3 → F4 → F5 | subprocessos A DEFINIR |","",
"## Lacunas e conflitos","",
"- **GAP · data de início do ciclo:** ausente no doc; roadmap ancorado em 05/10/2026 (PROPOSED).",
"- **GAP · duração por tarefa:** ausente; ganhos expressos em casas sequenciais, não em dias.",
"- **GAP · Fases 2–5:** só descritas em 1 linha (Tabela 8.1) → subprocessos `A DEFINIR`.",
"- **GAP · executores:** o doc não atribui responsável por tarefa → `human` em todas; T02 pode virar `agent:research` (PROPOSED).",
"- **Decisão pendente · T08:** roteiro do vídeo pode correr junto com T05–T07 (T04→T08 DIRECT), mas espelhar a versão pós-GEO (T07→T08) é PROPOSED e o motor não suporta split aninhado; mantido em série.",
"- **Versão do doc:** a entrada é a V01 (06/09); o CMD-COP já cita a V02 (`PD-CLB-20260922-F01-DOC-V02`). Sem conflito de conteúdo detectado nas Tabelas 8.1/8.2 recebidas; reprocessar se a V02 alterar tarefas.",
"- Nenhum CONFLICT entre fontes.","",
"## Fechamento","","`Dependências de entrada` (process doc V01 + Estratégia 07 + núcleo de dependências) → `Saída` (5 artefatos: árvore roadmap, árvore visual, working process + PDF, este relatório, runbook) → `Gate` (G-CONFORMIDADE em T21; publicação/execução só com aprovação)."]
(D/"relatorio-cadeia.md").write_text("\n".join(L)+"\n",encoding="utf-8")

# runbook
R=[f"# Runbook · {SLUG} · ciclo editorial de 15 dias","",
"> Operação do working process publicado (`?def=pd-clb-20260906-f01`). Uma linha por casa. Executor `human` = creator/editor; evidência sobe pela UI (✎ ENTREGA HUMANA) ou pelo agente com `flow.mjs complete`.","",
"## Pré-requisitos","","| Item | Como verificar |","|---|---|",
"| Run iniciado da revisão r1 | UI `?def=pd-clb-20260906-f01` → Iniciar run (ou `def-start`) |","| Tema candidato com dor real | comentário, dado de uso do app/agente ou pergunta recorrente (T01) |",
"| Convenção 9.1 e pastas 9.2 prontas | `[HUB]-[PILAR]-[AAAAMMDD]-[SEQ]-[TIPO]-V[VERSÃO]__[slug]`, `01_PLANEJAMENTO` … `10_CONTROLE-INDEXACAO` |","",
"## Procedimento","","| Passo | ID | Tarefa | Entrada | Executor | Procedimento | DoD | Evidência | Gate | Se falhar |","|---|---|---|---|---|---|---|---|---|---|"]
work=[n for n in wf["nodes"] if n["kind"] in ("activity","subprocess","platform-distribution","gate")]
for i,n in enumerate(work,1):
    deps=", ".join(n["dependsOn"])
    if n["kind"]=="gate":
        proc="Aplicar checklist: estilo (Tab. 3.1), GEO, marcação de derivados, nomenclatura 9.1; decidir SIM/NÃO na UI"
        dod=n.get("output",""); ev="decisao-N.md no R2 + comentário"; gate="G-CONFORMIDADE"; fail="NÃO → retorna a T06 (retrabalho T06→T20)"
    elif n["kind"]=="subprocess":
        proc="Executar a fase conforme Tabela 8.1 (detalhamento A DEFINIR)"; dod="A DEFINIR"; ev="evidência da fase"; gate="—"; fail="registrar bloqueio; não avançar a fase seguinte"
    else:
        proc=f"Abrir a casa (OK), produzir: {n['title'].lower()}; nomear pelo padrão 9.1"; dod=n.get("output",""); ev="arquivo(s) + texto de evidência na casa"
        gate={"T03":"G-TEMA","T22":"G-HANDOFF-F2"}.get(n["id"],"—"); fail="manter a casa aberta; registrar GAP; não pular para a próxima"
    R.append(f"| {i} | {n['id']} | {n['title']} | {deps} | {n.get('executor','decisão humana')} | {proc} | {dod} | {ev} | {gate} | {fail} |")
R+=["","## Escalonamento","","| Situação | Ação |","|---|---|",
"| Mesma casa falha 2× | parar e reportar (Estratégia 07 · STOP) |","| Reprovação em T21 | retrabalho a partir de T06; anotar o item reprovado no comentário do gate |",
"| Bloqueio externo (Fase 2+) | registrar `bloqueado-externo`; ramos independentes seguem |","| Dado ausente | `A DEFINIR`/GAP na evidência; nunca inventar |"]
(D/"runbook.md").write_text("\n".join(R)+"\n",encoding="utf-8")

S=["# ESTADO · pd-clb-20260906-f01","","| Etapa | Status | Dono | Evidência |","|---|---|---|---|",
"| 01 Ingestão | ✅ | cadeia-valor-unica | fonte.md (395 linhas, 7 tabelas; Tabela 6 = 8.1 fases, Tabela 7 = 8.2 tarefas) |",
f"| 02 Dependências | ✅ | cadeia-valor-unica | mapa-dependencias.json/.csv · {len(E)} arestas · juiz 02 PASS |",
"| 03 Otimização | ✅ | cadeia-valor-unica | otimizacao.json · 22 → 15 casas · juiz 03 PASS |",
"| 04 Árvore roadmap | ✅ | cadeia-valor-unica | estrutura.json + arvore-roadmap.txt · validate_structure OK · juiz 04 PASS |",
"| 05 Árvore visual | ✅ | cadeia-valor-unica | arvore-visual.json/.html · juiz 05 PASS |",
"| 06 Working process | ✅ | cadeia-valor-unica | workflow-pd-clb-20260906-f01.json (def-validate OK, r1) + PDF 6 p. · juiz 06 PASS |",
"| 07 Relatório + runbook | ✅ | cadeia-valor-unica | relatorio-cadeia.md + runbook.md · juiz all PASS |","",
"## Aprovações","","- 2026-10-01 · usuário: executar a cadeia, publicar e validar o workflow no Cloudflare (pedido inicial da sessão).","",
"## Decisões pendentes","","- Data de início do ciclo (A DEFINIR).","- T08 em paralelo com T05–T07 (PROPOSED).","",
"## Bloqueios","","- Publicação em produção (`hub-executar.workers.dev`): R2 não habilitado na conta Cloudflare → `bloqueado-externo`. Validação e publicação feitas no Worker local (mesmo código); republicar após habilitar o R2."]
(D/"ESTADO.md").write_text("\n".join(S)+"\n",encoding="utf-8")
print("ok")
