#!/usr/bin/env python3
"""Juiz da Cadeia de Valor Única: confere cada artefato e a coerência ENTRE eles.

Somente stdlib. Não corrige nada: aponta ERROS (bloqueiam ✅) e AVISOS.
Uso: python3 validar_cadeia.py out/cadeia/<slug> [--etapa 02|03|04|05|06|07|all]
Saída: relatório legível terminando em "RESULTADO: PASS" ou "RESULTADO: FAIL" (código 0/1).
"""
import argparse
import csv
import json
import re
import subprocess
import sys
from pathlib import Path

TAGS = {"DIRECT", "DERIVED", "PROPOSED", "CONFLICT", "GAP"}
CSV_COLS = ["dependency_id", "source_artifact_id", "target_artifact_id", "relation", "mandatory",
            "gate_id", "required_status", "status"]
WASTE = {"espera", "retrabalho", "handoff", "superprocessamento", "manual", "gargalo"}
CHANGES = {"paralelizar", "gate-antecipado", "automatizar", "reordenar", "eliminar-redundancia"}
TREE_TYPES = {"pasta", "arquivo", "porta", "evidencia", "referencia", "destino"}
TREE_STATES = {"atual", "liberado", "dependencia", "futuro", "bloqueado-interno", "bloqueado-externo", "concluido"}
WORK_KINDS = {"activity", "subprocess", "platform-distribution", "gate"}
REPORT_SECTIONS = ["Sumário executivo", "Mapa de dependências", "Otimização de processo",
                   "Working process", "Lacunas e conflitos", "Fechamento"]
RUNBOOK_COLS = ["Passo", "ID", "Tarefa", "Entrada", "Executor", "Procedimento", "DoD", "Evidência", "Gate", "Se falhar"]


class Rel:
    def __init__(self):
        self.erros, self.avisos, self.ok = [], [], []

    def e(self, etapa, msg):
        self.erros.append(f"[{etapa}] {msg}")

    def a(self, etapa, msg):
        self.avisos.append(f"[{etapa}] {msg}")

    def p(self, etapa, msg):
        self.ok.append(f"[{etapa}] {msg}")


def load_json(path, rel, etapa):
    if not path.exists():
        rel.e(etapa, f"arquivo ausente: {path.name}")
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        rel.e(etapa, f"{path.name}: JSON inválido ({exc})")
        return None


def mandatory_edges(mapa):
    return [(e["source"], e["target"]) for e in mapa.get("edges", []) if e.get("mandatory") is True]


def task_ids(mapa):
    return {n["id"] for n in mapa.get("nodes", []) if n.get("tipo") == "tarefa"}


def topo_layers(nodes, edges):
    indeg = {n: 0 for n in nodes}
    succ = {n: [] for n in nodes}
    for s, t in edges:
        if s in succ and t in indeg:
            succ[s].append(t)
            indeg[t] += 1
    layers, frontier = [], sorted(n for n, d in indeg.items() if d == 0)
    seen = 0
    while frontier:
        layers.append(frontier)
        seen += len(frontier)
        nxt = []
        for n in frontier:
            for t in succ[n]:
                indeg[t] -= 1
                if indeg[t] == 0:
                    nxt.append(t)
        frontier = sorted(nxt)
    return layers, seen == len(nodes)


def respects(order, edges):
    pos = {n: i for i, n in enumerate(order)}
    return [f"{s} → {t}" for s, t in edges if s in pos and t in pos and pos[s] >= pos[t]]


# ---------- etapas ----------

def etapa02(d, rel):
    mapa = load_json(d / "mapa-dependencias.json", rel, "02")
    if mapa is None:
        return None
    ids = [n.get("id") for n in mapa.get("nodes", [])]
    if len(ids) != len(set(ids)):
        rel.e("02", "IDs de nó duplicados")
    nodes = set(ids)
    dep_ids = set()
    for e in mapa.get("edges", []):
        did = e.get("dependency_id")
        if not did or did in dep_ids:
            rel.e("02", f"dependency_id ausente ou duplicado: {did}")
        dep_ids.add(did)
        for k in ("source", "target"):
            if e.get(k) not in nodes:
                rel.e("02", f"{did}: {k} {e.get(k)} inexistente")
        if e.get("tag") not in TAGS:
            rel.e("02", f"{did}: tag inválida ({e.get('tag')})")
        if not isinstance(e.get("mandatory"), bool):
            rel.e("02", f"{did}: mandatory deve ser true/false")
        if e.get("tag") == "DIRECT" and not e.get("fonte"):
            rel.e("02", f"{did}: DIRECT sem fonte")
        for k in ("motivo", "impacto"):
            if not e.get(k):
                rel.a("02", f"{did}: sem {k}")
    edges = mandatory_edges(mapa)
    layers, acyclic = topo_layers(nodes, edges)
    if not acyclic:
        rel.e("02", "ciclo entre dependências bloqueantes")
    else:
        rel.p("02", f"{len(nodes)} nós, {len(mapa.get('edges', []))} arestas ({len(edges)} bloqueantes), {len(layers)} camadas topológicas")
    proposed = sum(1 for e in mapa.get("edges", []) if e.get("tag") == "PROPOSED")
    if mapa.get("edges") and proposed > len(mapa["edges"]) / 2:
        rel.a("02", f"{proposed} arestas PROPOSED (> 50%): validar com o dono do processo")
    csv_path = d / "mapa-dependencias.csv"
    if not csv_path.exists():
        rel.e("02", "mapa-dependencias.csv ausente")
    else:
        with csv_path.open(encoding="utf-8") as f:
            header = next(csv.reader(f), [])
        if header != CSV_COLS:
            rel.e("02", f"CSV com cabeçalho fora do schema: {header}")
    return mapa


def etapa03(d, rel, mapa):
    opt = load_json(d / "otimizacao.json", rel, "03")
    if opt is None or mapa is None:
        return opt
    tasks = task_ids(mapa)
    for w in opt.get("desperdicios", []):
        if w.get("tipo") not in WASTE:
            rel.e("03", f"{w.get('id')}: tipo de desperdício inválido ({w.get('tipo')})")
        if w.get("tag") not in TAGS:
            rel.e("03", f"{w.get('id')}: tag inválida")
    for m in opt.get("mudancas", []):
        if m.get("tipo") not in CHANGES:
            rel.e("03", f"{m.get('id')}: tipo de mudança inválido ({m.get('tipo')})")
        if m.get("tag") not in TAGS:
            rel.e("03", f"{m.get('id')}: tag inválida")
        if not m.get("impacto"):
            rel.a("03", f"{m.get('id')}: sem impacto estimado")
    mand = set(mandatory_edges(mapa))
    for r in opt.get("arestas_removidas", []):
        pair = (r.get("source"), r.get("target")) if isinstance(r, dict) else None
        if pair in mand:
            rel.e("03", f"aresta bloqueante removida: {pair[0]} → {pair[1]} (proibido)")
    ordem = opt.get("estado_futuro", {}).get("ordem", [])
    missing = tasks - set(ordem)
    if missing:
        rel.e("03", f"estado futuro sem as tarefas: {sorted(missing)}")
    viol = respects(ordem, mand)
    if viol:
        rel.e("03", f"estado futuro viola o DAG: {viol}")
    if not viol and not missing:
        rel.p("03", f"{len(opt.get('desperdicios', []))} desperdícios, {len(opt.get('mudancas', []))} mudanças; estado futuro respeita {len(mand)} arestas bloqueantes")
    return opt


def etapa04(d, rel, mapa):
    est = load_json(d / "estrutura.json", rel, "04")
    if est is None:
        return None
    vendor = Path(__file__).parent / "vendor" / "validate_structure.py"
    proc = subprocess.run([sys.executable, str(vendor), str(d / "estrutura.json")], capture_output=True, text=True)
    if proc.returncode != 0:
        rel.e("04", "validate_structure.py reprovou: " + proc.stdout.strip().splitlines()[-1] if proc.stdout.strip() else "validate_structure.py falhou")
    ids = {t["id"] for dia in est.get("calendario", []) for c in dia.get("ciclos", {}).values() for t in c.get("tarefas", [])}
    if mapa is not None:
        missing = task_ids(mapa) - ids
        if missing:
            rel.e("04", f"tarefas do mapa ausentes no roadmap: {sorted(missing)}")
        mand = set(mandatory_edges(mapa))
        deps = {(dep, t["id"]) for dia in est.get("calendario", []) for c in dia.get("ciclos", {}).values()
                for t in c.get("tarefas", []) for dep in t.get("depende_de", [])}
        extra = {p for p in deps if p not in mand}
        if extra:
            rel.a("04", f"depende_de fora das arestas bloqueantes do mapa: {sorted(extra)[:5]}")
    if not (d / "arvore-roadmap.txt").exists():
        rel.e("04", "arvore-roadmap.txt ausente (rode vendor/render_tree_txt.py)")
    if proc.returncode == 0:
        rel.p("04", f"estrutura.json válido ({len(ids)} tarefas em {len(est.get('calendario', []))} dias)")
    return est


def walk(node, out, parent=None):
    out.append((node, parent))
    for child in node.get("filhos", []) or []:
        walk(child, out, node.get("id"))


def etapa05(d, rel, mapa):
    tree = load_json(d / "arvore-visual.json", rel, "05")
    if tree is None:
        return None
    flat = []
    walk(tree, flat)
    byid = {}
    for node, _ in flat:
        nid = node.get("id")
        if not nid or nid in byid:
            rel.e("05", f"id ausente ou duplicado: {nid}")
        byid[nid] = node
        if node.get("tipo") not in TREE_TYPES:
            rel.e("05", f"{nid}: tipo inválido ({node.get('tipo')})")
        if node.get("estado") is not None and node["estado"] not in TREE_STATES:
            rel.e("05", f"{nid}: estado inválido ({node['estado']})")
    for nid, node in byid.items():
        for dep in node.get("dependeDe", []) or []:
            if dep not in byid:
                rel.e("05", f"{nid}: dependeDe {dep} inexistente")
            elif nid not in (byid[dep].get("desbloqueia") or []):
                rel.e("05", f"assimetria: {nid} dependeDe {dep}, mas {dep} não desbloqueia {nid}")
        for nxt in node.get("desbloqueia", []) or []:
            if nxt not in byid:
                rel.e("05", f"{nid}: desbloqueia {nxt} inexistente")
            elif nid not in (byid[nxt].get("dependeDe") or []):
                rel.e("05", f"assimetria: {nid} desbloqueia {nxt}, mas {nxt} não dependeDe {nid}")
    if mapa is not None:
        missing = task_ids(mapa) - set(byid)
        if missing:
            rel.e("05", f"tarefas do mapa ausentes na árvore visual: {sorted(missing)}")
    atuais = [n for n in byid.values() if n.get("estado") == "atual"]
    if len(atuais) > 1:
        rel.a("05", f"{len(atuais)} nós 'atual' (o token reserva o vermelho a um só)")
    if not (d / "arvore-visual.html").exists():
        rel.e("05", "arvore-visual.html ausente (rode render_arvore_visual.py)")
    rel.p("05", f"árvore visual com {len(byid)} nós")
    return tree


def etapa06(d, rel, mapa):
    files = sorted(d.glob("workflow-*.json"))
    if not files:
        rel.e("06", "workflow-<slug>.json ausente")
        return None
    wf = load_json(files[0], rel, "06")
    if wf is None:
        return None
    nodes = wf.get("nodes", [])
    order = [n.get("id") for n in nodes]
    if not nodes or nodes[0].get("kind") != "start" or nodes[-1].get("kind") != "end":
        rel.e("06", "a definição deve começar no start e terminar no end")
    pos = {nid: i for i, nid in enumerate(order)}
    for i, n in enumerate(nodes):
        for dep in n.get("dependsOn", []):
            if dep not in pos or pos[dep] >= i:
                rel.e("06", f"{n.get('id')}: dependsOn {dep} inexistente ou posterior")
    if mapa is not None:
        missing = task_ids(mapa) - set(order)
        if missing:
            rel.e("06", f"tarefas do mapa ausentes no working process: {sorted(missing)}")
        viol = respects(order, mandatory_edges(mapa))
        if viol:
            rel.e("06", f"working process viola arestas bloqueantes: {viol}")
    pdfs = sorted(d.glob("workflow-*.pdf"))
    if not pdfs:
        rel.a("06", "PDF do workflow ainda não gerado (scripts/print-pdf.mjs)")
    rel.p("06", f"{files[0].name}: {len(nodes)} nós, {sum(1 for n in nodes if n.get('kind') in WORK_KINDS)} casas")
    return wf


def etapa07(d, rel, wf):
    rep = d / "relatorio-cadeia.md"
    if not rep.exists():
        rel.e("07", "relatorio-cadeia.md ausente")
    else:
        text = rep.read_text(encoding="utf-8")
        heads = re.findall(r"^##\s+(.+?)\s*$", text, re.M)
        idx = []
        for s in REPORT_SECTIONS:
            hit = next((i for i, h in enumerate(heads) if h.startswith(s)), None)
            if hit is None:
                rel.e("07", f"relatório sem a seção '## {s}'")
            idx.append(hit)
        if all(i is not None for i in idx) and idx != sorted(idx):
            rel.e("07", "seções do relatório fora de ordem")
        if "?def=" not in text or ".pdf" not in text.lower():
            rel.e("07", "relatório deve citar a URL ?def= e o PDF do workflow")
    rb = d / "runbook.md"
    if not rb.exists():
        rel.e("07", "runbook.md ausente")
        return
    text = rb.read_text(encoding="utf-8")
    header = next((l for l in text.splitlines() if l.startswith("| Passo")), "")
    cols = [c.strip() for c in header.strip("|").split("|")]
    if cols != RUNBOOK_COLS:
        rel.e("07", f"runbook: cabeçalho deve ser {' | '.join(RUNBOOK_COLS)}")
    if wf is not None:
        rows_ids = set(re.findall(r"^\|\s*\d+\s*\|\s*([A-Z][A-Z0-9-]*)\s*\|", text, re.M))
        work = {n["id"] for n in wf.get("nodes", []) if n.get("kind") in WORK_KINDS}
        missing = work - rows_ids
        if missing:
            rel.e("07", f"runbook sem linha para: {sorted(missing)}")
        else:
            rel.p("07", f"runbook cobre {len(work)} casas; relatório com {len(REPORT_SECTIONS)} seções")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("dir")
    ap.add_argument("--etapa", default="all")
    args = ap.parse_args()
    d = Path(args.dir)
    rel = Rel()
    want = lambda n: args.etapa in ("all", n)  # noqa: E731
    mapa = etapa02(d, rel) if want("02") or args.etapa in ("03", "04", "05", "06") else None
    if args.etapa in ("03", "04", "05", "06") and mapa is not None:
        # dependência de leitura: só reporta erros da etapa pedida
        rel.erros = [e for e in rel.erros if not e.startswith("[02]")]
        rel.ok = [o for o in rel.ok if not o.startswith("[02]")]
        rel.avisos = [a for a in rel.avisos if not a.startswith("[02]")]
    if want("03"):
        etapa03(d, rel, mapa)
    if want("04"):
        etapa04(d, rel, mapa)
    if want("05"):
        etapa05(d, rel, mapa)
    wf = None
    if want("06") or want("07"):
        sub = Rel()
        wf = etapa06(d, sub if not want("06") else rel, mapa)
    if want("07"):
        etapa07(d, rel, wf)

    print(f"# Validação da cadeia · {d} · etapa {args.etapa}\n")
    for o in rel.ok:
        print(f"✓ {o}")
    for a in rel.avisos:
        print(f"⚠ {a}")
    for e in rel.erros:
        print(f"✗ {e}")
    print(f"\nERROS: {len(rel.erros)} · AVISOS: {len(rel.avisos)}")
    print(f"RESULTADO: {'PASS' if not rel.erros else 'FAIL'}")
    sys.exit(0 if not rel.erros else 1)


if __name__ == "__main__":
    main()
