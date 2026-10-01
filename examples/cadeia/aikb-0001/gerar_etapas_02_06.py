"""Etapas 02–06 da cadeia-valor-unica aplicadas ao AIKB-0001 (PD-CLB-20260906-F01-DOC-V01)."""
import csv, json, re, sys
from datetime import date, timedelta
from pathlib import Path

D = Path(sys.argv[1]); SLUG = "pd-clb-20260906-f01"
fonte = (D / "fonte.md").read_text(encoding="utf-8")
rows = re.findall(r"^\| (\d{2}) \| (.+?) \| (.+?) \|$", fonte, re.M)
T = {f"T{n}": {"titulo": t.strip(), "dod": d.strip()} for n, t, d in rows}
assert len(T) == 22, len(T)

# ---------- 02 · dependências ----------
SRC = "Tabela 8.2 (Tarefas 01–22)"
E = []  # (source, target, mandatory, tag, relation, motivo, impacto, fonte)
def e(s, t, tag, rel, motivo, impacto, fonte=SRC, mandatory=True):
    E.append(dict(source=s, target=t, mandatory=mandatory, tag=tag, relation=rel, motivo=motivo, impacto=impacto, fonte=fonte))
e("T01","T02","DERIVED","valida-tema-para","a pesquisa sustenta os claims do tema validado","pesquisa sem foco; evidência descartada")
e("T02","T03","DERIVED","fornece-evidencia-para","título de trabalho e CTA dependem dos claims sustentados","Topic Pack sem lastro (viola 'zero coach')")
e("T03","T04","DERIVED","define-escopo-de","o outline parte do título, CTA e ferramenta do Topic Pack","outline sem CTA/ferramenta")
e("T02","T04","DERIVED","fornece-evidencia-para","o outline já marca Claim/Evidência por bloco (Tópico 3.2)","blocos sem evidência marcada")
e("T04","T05","DIRECT","estrutura","redação segue o outline em blocos (Tópico 5.2)","texto fora da estrutura de 11 blocos", "Tabela 8.2 linhas 04–05 + Tópico 5.2")
e("T05","T06","DIRECT","revisa","a revisão aplica a Tabela 3.1 ao texto final","revisão de texto inexistente", "Tabela 8.2 linha 06 + Tabela 3.1")
e("T06","T07","DERIVED","precede","GEO/SEO reestrutura o texto já aprovado em estilo","retrabalho de estilo após GEO")
e("T04","T08","DIRECT","espelha-blocos","o roteiro tem 'blocos espelhando o artigo'","vídeo desalinhado do artigo", "Tabela 8.2 linha 08")
e("T07","T08","PROPOSED","espelha-versao-final","espelhar a versão final (pós-GEO) evita divergência de nomenclatura","roteiro cita trechos que mudaram no GEO", mandatory=True)
e("T07","T09","DIRECT","marca-trechos-de","marcação 'no artigo' exige o texto final","trechos-fonte apontam para versão antiga", "Tabela 8.2 linha 09")
e("T08","T09","DIRECT","marca-timestamps-de","marcação 'no roteiro do vídeo' exige o roteiro","derivados de vídeo sem timestamp", "Tabela 8.2 linha 09")
for t, tag, why in [("T10","DIRECT","'a partir dos trechos marcados'"),("T11","DERIVED","cortes do vídeo mãe usam os timestamps marcados"),
                    ("T12","DERIVED","carrosséis são derivados (Tabela 5.1) dos trechos marcados"),("T13","DERIVED","imagens estáticas são derivados dos trechos marcados"),
                    ("T14","DERIVED","infográficos representam dados marcados como derivado"),("T15","DERIVED","stories são derivados com CTA do ciclo")]:
    e("T09", t, tag, "alimenta-derivado", why, "derivado sem trecho-fonte rastreável", "Tabela 8.2 linhas 09–15 + Tabela 5.1")
e("T07","T16","DERIVED","fornece-conteudo-para","newsletters educam a partir da peça-mãe final","newsletter diverge do artigo")
e("T09","T16","PROPOSED","alimenta-derivado","newsletter pode citar trechos marcados","—", mandatory=False)
e("T03","T17","DIRECT","define-cta-de","ebooks são 'lead magnets ligados ao CTA do Topic Pack'","ebook com CTA errado", "Tabela 8.2 linha 17")
e("T02","T17","DERIVED","fornece-evidencia-para","o ebook aprofunda um recorte com evidências levantadas","ebook sem lastro")
for t in ["T10","T11","T12","T13","T15","T16","T17"]:
    e(t, "T18", "DERIVED", "recebe-cta", "o mapeamento define 'em quais peças' cada CTA aparece: as peças precisam existir", "CTA mapeado em peça inexistente")
e("T14","T18","PROPOSED","recebe-cta","infográfico pode carregar CTA de ferramenta","—", mandatory=False)
e("T18","T19","DERIVED","fornece-cta-para","a coerência do arco cruza continuidade de nomenclatura e CTA","CTA incoerente entre artigos do arco")
e("T19","T20","DERIVED","precede","nomenclatura final só após ajustes de coerência","renomear arquivos duas vezes")
e("T14","T20","DERIVED","fornece-arquivo-para","indexação de 'todos os arquivos' inclui os briefings","briefing fora da convenção 9.1")
e("T20","T21","DIRECT","verificado-por","o checklist confirma a nomenclatura antes do handoff","handoff com arquivos fora do padrão", "Tabela 8.2 linha 21")
e("T21","T22","DIRECT","libera","checklist 'antes de liberar para a Fase 2'","Fase 2 recebe pacote não conforme", "Tabela 8.2 linhas 21–22")
e("T22","F2","DIRECT","handoff-para","Fase 2 'depende do handoff da Tarefa 22'","Fase 2 sem briefing técnico", "Tabela 8.1")
e("F2","F3","DIRECT","precede","Fase 3 depende da Fase 2","—","Tabela 8.1")
e("F3","F4","DIRECT","precede","Fase 4 depende da Fase 3","—","Tabela 8.1")
e("F4","F5","DIRECT","precede","Fase 5 depende da Fase 4","—","Tabela 8.1")
e("F5","T01","DIRECT","retroalimenta","feedback do ciclo alimenta o próximo tema (Tópico 2.2)","próximo ciclo sem dado de uso","Tabela 8.1 + Tópico 2.2", mandatory=False)

GATE = {"T21":"G-CONFORMIDADE","T22":"G-HANDOFF-F2","F2":"G-HANDOFF-F2"}
for i, x in enumerate(E, 1):
    x["dependency_id"] = f"DEP-{i:04d}"
    x["gate_id"] = GATE.get(x["target"], "gate:tbd")
    x["required_status"] = "concluida"
    x["status"] = "ativa" if x["mandatory"] else "informativa"
FASES = {"F2":"Fase 2 — Geração de imagens e vídeos","F3":"Fase 3 — Revisão","F4":"Fase 4 — Agendamento e publicação","F5":"Fase 5 — Análise e desempenho"}
nodes = [{"id":k,"titulo":v["titulo"],"tipo":"tarefa","fase":"F1","entregavel":v["dod"]} for k,v in T.items()]
nodes += [{"id":k,"titulo":v,"tipo":"fase"} for k,v in FASES.items()]
mapa = {"meta":{"slug":SLUG,"fonte":"PD-CLB-20260906-F01-DOC-V01 (AIKB-0001)","gerado_em":"2026-10-01","leitura":"target depende de source"},
        "nodes":nodes,"edges":[{k:x[k] for k in ["dependency_id","source","target","relation","mandatory","gate_id","required_status","status","motivo","impacto","tag","fonte"]} for x in E]}
(D/"mapa-dependencias.json").write_text(json.dumps(mapa,ensure_ascii=False,indent=1),encoding="utf-8")
with (D/"mapa-dependencias.csv").open("w",newline="",encoding="utf-8") as f:
    w=csv.writer(f); w.writerow(["dependency_id","source_artifact_id","target_artifact_id","relation","mandatory","gate_id","required_status","status"])
    for x in E: w.writerow([x["dependency_id"],x["source"],x["target"],x["relation"],"TRUE" if x["mandatory"] else "FALSE",x["gate_id"],x["required_status"],x["status"]])

# ---------- 03 · otimização ----------
ordem_atual = list(T)
futura = ["T01","T02","T03","T04","T05","T06","T07","T08","T17","T09","T10","T11","T12","T13","T14","T15","T16","T18","T19","T20","T21","T22"]
opt = {
 "estado_atual":{"ordem":ordem_atual,"descricao":"22 tarefas em série estrita (ordem da Tabela 8.2), 1 checagem de conformidade no fim (T21)","casas_sequenciais":22},
 "caminho_critico":["T01","T02","T03","T04","T05","T06","T07","T08","T09","T11","T18","T19","T20","T21","T22"],
 "desperdicios":[
  {"id":"W01","tipo":"espera","onde":["T17"],"descricao":"Ebooks (T17) esperam toda a peça-mãe e os derivados, mas só dependem do Topic Pack (T03) e das evidências (T02).","tag":"DERIVED"},
  {"id":"W02","tipo":"gargalo","onde":["T10","T11","T12","T13","T14","T15","T16"],"descricao":"Sete derivados em série, embora todos dependam apenas da marcação de trechos (T09) e da peça-mãe final (T07).","tag":"DERIVED"},
  {"id":"W03","tipo":"retrabalho","onde":["T21"],"descricao":"Conformidade (estilo, GEO, marcação, nomenclatura) só é checada em T21: falha tardia reabre o ciclo a partir da revisão.","tag":"DERIVED"},
  {"id":"W04","tipo":"manual","onde":["T20"],"descricao":"Indexação e renomeação de todos os arquivos feitas à mão no fim do ciclo (convenção 9.1 / pastas 9.2).","tag":"DERIVED"},
  {"id":"W05","tipo":"handoff","onde":["T14","T22"],"descricao":"Specs de formato aparecem no briefing dos infográficos (T14) e de novo no pacote de handoff (T22).","tag":"PROPOSED"}],
 "mudancas":[
  {"id":"M01","tipo":"paralelizar","descricao":"Ramo paralelo: T17 (ebooks) corre junto com a peça-mãe T04→T08, logo após o Topic Pack.","afeta":["T17","T04","T05","T06","T07","T08"],"impacto":"−1 casa sequencial (T17 sai do caminho crítico); duração em dias A DEFINIR","tag":"DERIVED","resolve":["W01"]},
  {"id":"M02","tipo":"paralelizar","descricao":"Derivados T10–T16 em paralelo entre PS2 e PJ2 (todos dependem só de T09/T07).","afeta":["T10","T11","T12","T13","T14","T15","T16"],"impacto":"−6 casas sequenciais (7 derivados → 1 bloco); duração em dias A DEFINIR","tag":"DERIVED","resolve":["W02"]},
  {"id":"M03","tipo":"gate-antecipado","descricao":"Aplicar o checklist de estilo (Tabela 3.1) na saída de T06 e a convenção 9.1 na criação de cada arquivo; T21 vira conferência final com retorno a T06.","afeta":["T06","T20","T21"],"impacto":"menos retrabalho tardio; taxa de reprovação em T21 A DEFINIR","tag":"PROPOSED","resolve":["W03"]},
  {"id":"M04","tipo":"automatizar","descricao":"Gerar nomes `[HUB]-[PILAR]-[AAAAMMDD]-[SEQ]-[TIPO]-V[VERSÃO]__[slug]` e as 10 pastas por script; T20 passa a validar em vez de renomear.","afeta":["T20"],"impacto":"T20 de manual para verificação; esforço A DEFINIR","tag":"PROPOSED","resolve":["W04"]},
  {"id":"M05","tipo":"eliminar-redundancia","descricao":"Template único de briefing técnico (proporção, duração, texto na tela) preenchido em T11–T14 e apenas consolidado em T22.","afeta":["T11","T12","T13","T14","T22"],"impacto":"handoff sem redigitação; A DEFINIR","tag":"PROPOSED","resolve":["W05"]}],
 "arestas_removidas":[],
 "decisoes_pendentes":[
  "T08 (roteiro do vídeo) poderia correr junto com T05–T07 (DEP T04→T08 é DIRECT), mas depende da versão pós-GEO (DEP T07→T08 PROPOSED) e o motor não suporta split aninhado: mantido em série após T07 até decisão do dono do processo.",
  "Data de início do ciclo: A DEFINIR (roadmap usa 2026-10-05 como referência PROPOSED)."],
 "estado_futuro":{"ordem":futura,"paralelos":[["T04-T08","T17"],["T10","T11","T12","T13","T14","T15","T16"]],"casas_sequenciais":15,
                  "premissa":"ASSUMPTION: casas de duração equivalente; ganho em dias A DEFINIR (doc não traz duração por tarefa)"}}
(D/"otimizacao.json").write_text(json.dumps(opt,ensure_ascii=False,indent=1),encoding="utf-8")

# ---------- 04 · árvore roadmap ----------
start = date(2026,10,5)
plan = {1:[("M0","T01")],2:[("M1","T02")],3:[("M2","T03")],4:[("M1","T04"),("M2","T17")],5:[("M1","T05")],6:[("M1","T06")],7:[("M2","T07")],
        8:[("M1","T08")],9:[("M2","T09")],10:[("M1","T10"),("M2","T11")],11:[("M1","T12"),("M2","T13")],12:[("M1","T14"),("M2","T15"),("M3","T16")],
        13:[("M3","T18"),("M3","T19")],14:[("M3","T20"),("M4","T21")],15:[("M4","T22")]}
mand = {}
for x in E:
    if x["mandatory"] and x["source"] in T and x["target"] in T: mand.setdefault(x["target"],[]).append(x["source"])
PORTA = {"T01":"G-TEMA","T03":"G-TEMA","T21":"G-CONFORMIDADE","T22":"G-HANDOFF-F2"}
DIAS = ["SEGUNDA","TERCA","QUARTA","QUINTA","SEXTA","SABADO","DOMINGO"]
peso = round(100/22,3); cal=[]; count=0
for d in range(1,16):
    dt = start+timedelta(days=d-1)
    ciclos = {c:{"tarefas":[]} for c in ["M0","M1","M2","M3","M4","18H"]}
    for c,tid in plan[d]:
        count+=1
        ciclos[c]["tarefas"].append({"id":tid,"titulo":T[tid]["titulo"],"peso":peso if count<22 else round(100-peso*21,3),
            "depende_de":sorted(mand.get(tid,[])),"porta":PORTA.get(tid),"status":"marco" if tid=="T22" else "aberta","evidencia":None})
    cal.append({"data":dt.isoformat(),"label":f"D{d:02d}_{dt.day:02d}_{DIAS[dt.weekday()]}","objetos":len(plan[d]),
                "peso_dia":round(sum(t["peso"] for c in ciclos.values() for t in c["tarefas"]),3),"ciclos":ciclos})
est = {"meta":{"titulo":"PD-CLB-20260906-F01 · CICLO EDITORIAL 15 DIAS","objetivo":"produzir_o_pacote_da_Fase_1_e_entregar_o_handoff_para_a_Fase_2",
        "inicio":cal[0]["data"],"fim":cal[-1]["data"],"total_peso":100.0,"unidades_executaveis":22,"dias_operacionais":15,
        "nota":"Data de início A DEFINIR: 2026-10-05 é referência PROPOSED; calendário relativo D01–D15 (Tópico 5, ciclo de 15 dias)."},
 "fluxos_de_valor":[{"id":"VS-01","nome":"TEMA_E_EVIDENCIAS","peso":13.636},{"id":"VS-02","nome":"PECA_MAE","peso":27.273},{"id":"VS-03","nome":"DERIVADOS","peso":36.364},{"id":"VS-04","nome":"INTEGRACAO_E_HANDOFF","peso":22.727}],
 "portas":[{"id":"G-TEMA","itens":["tema_com_dor_real_e_encaixe_de_nicho","topic_pack_fechado_titulo_cta_ferramenta"],"libera":"G-CONFORMIDADE"},
           {"id":"G-CONFORMIDADE","itens":["estilo_tabela_3.1","geo_seo","marcacao_de_derivados","nomenclatura_9.1"],"libera":"G-HANDOFF-F2"},
           {"id":"G-HANDOFF-F2","itens":["briefings_tecnicos_por_asset","specs_proporcao_duracao_texto_na_tela"],"libera":"POS_LANCAMENTO"}],
 "calendario":cal}
(D/"estrutura.json").write_text(json.dumps(est,ensure_ascii=False,indent=1),encoding="utf-8")

# ---------- 05 · árvore visual ----------
deps_v = {}; unl_v = {}
for x in E:
    if x["mandatory"]:
        deps_v.setdefault(x["target"],[]).append(x["source"]); unl_v.setdefault(x["source"],[]).append(x["target"])
def leaf(tid, estado="futuro", tipo="arquivo", titulo=None, nota=None):
    n={"id":tid,"titulo":titulo or f"{tid} · {T[tid]['titulo']}","tipo":tipo,"estado":estado}
    if nota: n["nota"]=nota
    if tid in deps_v: n["dependeDe"]=sorted(deps_v[tid])
    if tid in unl_v: n["desbloqueia"]=sorted(unl_v[tid])
    return n
tree = {"id":SLUG,"titulo":"PD-CLB · CADEIA DE VALOR ÚNICA (ciclo 15 dias)","tipo":"pasta","estado":"liberado","aberto":True,"filhos":[
 {"id":"R-F1","titulo":"FASE 1 · PRODUÇÃO (estado futuro)","tipo":"pasta","estado":"liberado","aberto":True,"filhos":[
   {"id":"R-TEMA","titulo":"Tema e evidências · T01–T03","tipo":"pasta","estado":"liberado","aberto":True,"filhos":[leaf("T01","atual"),leaf("T02","liberado"),leaf("T03","liberado")]},
   {"id":"R-MAE","titulo":"Peça-mãe ∥ ebooks · T04–T08 + T17","tipo":"pasta","estado":"futuro","filhos":[leaf(t) for t in ["T04","T05","T06","T07","T08"]]+[leaf("T17",nota="ramo paralelo (M01)")]},
   {"id":"R-DER","titulo":"Derivados em paralelo · T09 → T10–T16","tipo":"pasta","estado":"futuro","filhos":[leaf("T09")]+[leaf(t,nota="paralelo (M02)") for t in ["T10","T11","T12","T13","T14","T15","T16"]]},
   {"id":"R-INT","titulo":"Integração e handoff · T18–T22","tipo":"pasta","estado":"futuro","filhos":[leaf("T18"),leaf("T19"),leaf("T20"),leaf("T21",tipo="porta",titulo="T21 · Checklist de conformidade (porta)"),leaf("T22",tipo="destino",titulo="T22 · Handoff para a Fase 2")]}]},
 {"id":"R-FASES","titulo":"FASES 2–5 (A DEFINIR: doc detalha só a Fase 1)","tipo":"pasta","estado":"futuro","filhos":[
   dict({"id":k,"titulo":v,"tipo":"pasta","estado":"dependencia","nota":"A DEFINIR"},**({"dependeDe":sorted(deps_v[k])} if k in deps_v else {}),**({"desbloqueia":sorted(unl_v[k])} if k in unl_v else {})) for k,v in FASES.items()]},
 {"id":"R-CRIT","titulo":"NÓS CRÍTICOS","tipo":"pasta","estado":"dependencia","filhos":[
   {"id":"CR-T09","titulo":"T09 · marcação de trechos: alimenta 6 derivados","tipo":"referencia","nota":"caminho crítico"},
   {"id":"CR-T21","titulo":"T21 · conformidade tardia (M03)","tipo":"referencia","nota":"retorno a T06 se reprovar"},
   {"id":"CR-DATA","titulo":"Data de início do ciclo","tipo":"referencia","estado":"bloqueado-externo","nota":"A DEFINIR (usuário)"}]},
 {"id":"R-OTIM","titulo":"OTIMIZAÇÕES (M01–M05)","tipo":"pasta","filhos":[{"id":m["id"],"titulo":f"{m['id']} · {m['tipo']} · {m['tag']}","tipo":"referencia","nota":m["impacto"]} for m in opt["mudancas"]]},
 {"id":"R-EVID","titulo":"EVIDÊNCIAS","tipo":"pasta","filhos":[
   {"id":"EV-MAPA","titulo":"mapa-dependencias.json/.csv","tipo":"evidencia"},{"id":"EV-WF","titulo":f"workflow-{SLUG}.json + PDF","tipo":"evidencia"},
   {"id":"EV-RB","titulo":"runbook.md","tipo":"evidencia"},{"id":"EV-REL","titulo":"relatorio-cadeia.md","tipo":"evidencia"}]}]}
(D/"arvore-visual.json").write_text(json.dumps(tree,ensure_ascii=False,indent=1),encoding="utf-8")

# ---------- 06 · working process ----------
def act(tid, phase, dep):
    return {"id":tid,"kind":"activity","title":T[tid]["titulo"],"phase":phase,"dependsOn":[dep],"executor":"human","output":T[tid]["dod"],
            "ids":[x["dependency_id"] for x in E if x["target"]==tid and x["mandatory"]]}
N=[{"id":"START","kind":"start","title":"Início do ciclo (15 dias)","dependsOn":[]}]
N.append(act("T01","f1-a","START")); N.append(act("T02","f1-a","T01")); N.append(act("T03","f1-a","T02"))
N.append({"id":"PS1","kind":"parallel-split","title":"Peça-mãe ∥ ebooks (M01)","phase":"f1-b","dependsOn":["T03"],"symbol":"+"})
N.append(act("T04","f1-b","PS1"))
for a,b in [("T05","T04"),("T06","T05"),("T07","T06"),("T08","T07")]: N.append(act(a,"f1-b",b))
N.append(act("T17","f1-b","PS1"))
N.append({"id":"PJ1","kind":"parallel-join","title":"Peça-mãe e ebooks prontos","phase":"f1-b","dependsOn":["T08","T17"],"symbol":"+"})
N.append(act("T09","f1-c","PJ1"))
N.append({"id":"PS2","kind":"parallel-split","title":"Derivados em paralelo (M02)","phase":"f1-c","dependsOn":["T09"],"symbol":"+"})
der=["T10","T11","T12","T13","T14","T15","T16"]
for t in der: N.append(act(t,"f1-c","PS2"))
N.append({"id":"PJ2","kind":"parallel-join","title":"Derivados prontos","phase":"f1-c","dependsOn":der,"symbol":"+"})
N.append(act("T18","f1-d","PJ2")); N.append(act("T19","f1-d","T18")); N.append(act("T20","f1-d","T19"))
N.append({"id":"T21","kind":"gate","title":"Checklist de conformidade pré-handoff","phase":"f1-d","dependsOn":["T20"],"decision":"human","event":"t21-conformidade",
          "output":T["T21"]["dod"],"onReject":{"target":"T06","label":"Corrigir estilo/GEO/marcação/nomenclatura"}})
N.append(act("T22","f1-d","T21"))
prev="T22"
for k,v in FASES.items():
    N.append({"id":k,"kind":"subprocess","title":v,"phase":f"fase-{k[1]}","dependsOn":[prev],"executor":"human","note":"A DEFINIR: o process doc detalha só a Fase 1"}); prev=k
N.append({"id":"END","kind":"end","title":"Ciclo encerrado · feedback para o próximo tema","dependsOn":[prev]})
wf={"id":SLUG,"version":1,"program":"PROGRAMA EXECUTAR · CADEIA DE VALOR ÚNICA","title":"CREATOR-LED GROWTH · CICLO EDITORIAL 15 DIAS",
    "subtitle":"Working process (estado futuro) · PD-CLB-20260906-F01-DOC-V01","source":["AIKB-0001 · PD-CLB-20260906-F01-DOC-V01 (Tabelas 8.1 e 8.2)","cadeia-valor-unica · mapa-dependencias.json + otimizacao.json"],
    "phases":[{"id":"f1-a","number":"1A","name":"Tema e evidências"},{"id":"f1-b","number":"1B","name":"Peça-mãe ∥ ebooks"},{"id":"f1-c","number":"1C","name":"Derivados"},
              {"id":"f1-d","number":"1D","name":"Integração e handoff"},{"id":"fase-2","number":"02","name":"Geração de imagens e vídeos"},{"id":"fase-3","number":"03","name":"Revisão"},
              {"id":"fase-4","number":"04","name":"Agendamento e publicação"},{"id":"fase-5","number":"05","name":"Análise e desempenho"}],"nodes":N}
(D/f"workflow-{SLUG}.json").write_text(json.dumps(wf,ensure_ascii=False,indent=1),encoding="utf-8")
print("ok", len(E), "arestas;", len(N), "nós no workflow")
