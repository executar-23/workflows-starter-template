#!/usr/bin/env python3
"""Validador estrutural do plugin executar-cop (somente stdlib).

Checa os critérios de VALIDATION do HANDOFF-AGENTES-001 e do ADR-0003:
índice CMD-COP ↔ commands ↔ grafo, grafo sem links quebrados nem ciclos,
núcleo de dependências referenciado em toda skill/command/agente, token visual
nas saídas visuais, busca web declarada nas Camadas 2 e 3 e frontmatter dos agentes.

Uso: python3 scripts/validar_plugin.py [raiz-do-plugin]
Sai com código 1 se houver erro. Avisos não bloqueiam.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

NUCLEO = "nucleo-dependencias.md"
TOKEN = "calendario-light-mode.md"
BUSCA = re.compile(r"busca web", re.I)
ID_LINE = re.compile(r"^(?:- )?(CV-[A-Z]+-\d{3}) — (/[a-z][a-z-]*) — (.+)$")
ROUTE_ROW = re.compile(r"^\| (CV-[A-Z]+-\d{3}) \| (/[a-z-]+) \| (.+?) \| ([A-Z-]+) \| (.+?) \| (.+?) \| (.+?) \|$")
AGENT_NAME = re.compile(r"^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$")
MODELS = {"inherit", "sonnet", "opus", "haiku"}
COLORS = {"blue", "cyan", "green", "yellow", "magenta", "red"}
EPISTEMIC = {"DIRECT", "DERIVED", "PROPOSED", "CONFLICT", "GAP"}
NODE_KEYS = {"id", "titulo", "tipo", "camada", "modulo", "cv_ids", "depende_de", "desbloqueia", "porta", "estado", "saida_visual"}
EDGE_KEYS = {"dependency_id", "source_artifact_id", "target_artifact_id", "relation", "mandatory", "gate_id",
             "required_status", "status", "status_epistemico", "justificativa"}


class Relatorio:
    def __init__(self) -> None:
        self.erros: list[str] = []
        self.avisos: list[str] = []
        self.ok: list[str] = []

    def erro(self, msg: str) -> None:
        self.erros.append(msg)

    def aviso(self, msg: str) -> None:
        self.avisos.append(msg)


def frontmatter(texto: str) -> tuple[str, str]:
    if not texto.startswith("---\n"):
        return "", texto
    fim = texto.find("\n---", 4)
    if fim < 0:
        return "", texto
    return texto[4:fim], texto[fim + 4:]


def campo(fm: str, chave: str) -> str | None:
    m = re.search(rf"^{chave}:\s*(.*)$", fm, re.M)
    return m.group(1).strip() if m else None


def descricao(fm: str) -> str:
    m = re.search(r"^description:\s*(.*?)(?=^(?:name|model|color|tools|argument-hint|allowed-tools|metadata|version|user-invocable):|\Z)",
                  fm, re.M | re.S)
    return m.group(1).strip() if m else ""


def ler_indice(raiz: Path, r: Relatorio) -> tuple[dict[str, str], dict[str, dict]]:
    texto = (raiz / "references/cmd-cop-index.md").read_text(encoding="utf-8")
    ids: dict[str, str] = {}
    slashes: dict[str, str] = {}
    for linha in texto.splitlines():
        m = ID_LINE.match(linha.strip())
        if not m:
            continue
        cv, slash, _ = m.groups()
        if cv in ids:
            r.erro(f"índice: ID duplicado {cv}")
        if slash in slashes:
            r.erro(f"índice: slash duplicado {slash} ({slashes[slash]} e {cv})")
        ids[cv] = slash
        slashes[slash] = cv
    rotas: dict[str, dict] = {}
    for linha in texto.splitlines():
        m = ROUTE_ROW.match(linha.strip())
        if m:
            cv, slash, modulo, no, prov, visual, busca = m.groups()
            rotas[cv] = {"slash": slash, "modulo": modulo, "no": no, "prov": prov,
                         "visual": visual.strip("*").startswith("sim"),
                         "busca": not busca.strip().startswith("não")}
    for cv, slash in ids.items():
        if cv not in rotas:
            r.erro(f"índice: {cv} sem linha de roteamento (§4)")
        elif rotas[cv]["slash"] != slash:
            r.erro(f"índice: {cv} com slash divergente entre a lista ({slash}) e o roteamento ({rotas[cv]['slash']})")
        elif not re.match(r"^(DIRECT|DERIVED|PROPOSED|CONFLICT|GAP)\b", rotas[cv]["prov"]):
            r.erro(f"índice: {cv} sem proveniência epistêmica no roteamento")
    for cv in rotas:
        if cv not in ids:
            r.erro(f"índice: roteamento cita {cv}, ausente da lista de IDs")
    r.ok.append(f"índice: {len(ids)} IDs, {len(slashes)} slashes, {len(rotas)} rotas")
    return ids, rotas


def ciclos(nos: dict[str, dict]) -> list[list[str]]:
    achados: list[list[str]] = []
    cor: dict[str, int] = {n: 0 for n in nos}
    pilha: list[str] = []

    def visitar(n: str) -> None:
        cor[n] = 1
        pilha.append(n)
        for d in nos[n]["desbloqueia"]:
            if d not in cor:
                continue
            if cor[d] == 1:
                achados.append(pilha[pilha.index(d):] + [d])
            elif cor[d] == 0:
                visitar(d)
        pilha.pop()
        cor[n] = 2

    for n in nos:
        if cor[n] == 0:
            visitar(n)
    return achados


def ler_grafo(raiz: Path, ids: dict[str, str], rotas: dict[str, dict], r: Relatorio) -> dict[str, dict]:
    g = json.loads((raiz / "references/grafo-dependencias.json").read_text(encoding="utf-8"))
    json.loads((raiz / "references/grafo-dependencias.schema.json").read_text(encoding="utf-8"))
    nos: dict[str, dict] = {}
    for no in g.get("nos", []):
        falta = NODE_KEYS - set(no)
        if falta:
            r.erro(f"grafo: nó {no.get('id')} sem campos {sorted(falta)}")
            continue
        if no["id"] in nos:
            r.erro(f"grafo: nó duplicado {no['id']}")
        if no["estado"] not in {"aberta", "concluida", "bloqueada", "marco"}:
            r.erro(f"grafo: {no['id']} com estado inválido {no['estado']}")
        nos[no["id"]] = no
    for n, no in nos.items():
        for d in no["depende_de"]:
            if d not in nos:
                r.erro(f"grafo: {n}.depende_de aponta para inexistente {d}")
            elif n not in nos[d]["desbloqueia"]:
                r.erro(f"grafo: assimetria — {n} depende_de {d}, mas {d} não desbloqueia {n}")
        for d in no["desbloqueia"]:
            if d not in nos:
                r.erro(f"grafo: {n}.desbloqueia aponta para inexistente {d}")
            elif n not in nos[d]["depende_de"]:
                r.erro(f"grafo: assimetria — {n} desbloqueia {d}, mas {d} não depende_de {n}")
        for cv in no["cv_ids"]:
            if cv not in ids:
                r.erro(f"grafo: {n} cita {cv}, ausente do índice")
            elif rotas.get(cv, {}).get("no") != n:
                r.erro(f"grafo: {cv} está em {n}, mas o índice roteia para {rotas.get(cv, {}).get('no')}")
    donos: dict[str, list[str]] = {}
    for n, no in nos.items():
        for cv in no["cv_ids"]:
            donos.setdefault(cv, []).append(n)
    for cv in ids:
        if len(donos.get(cv, [])) != 1:
            r.erro(f"grafo: {cv} deve pertencer a exatamente 1 nó (encontrado: {donos.get(cv, [])})")
    pares_nos = {(d, n) for n, no in nos.items() for d in no["depende_de"]}
    pares_arestas = set()
    dep_ids = set()
    for a in g.get("arestas", []):
        falta = EDGE_KEYS - set(a)
        if falta:
            r.erro(f"grafo: aresta {a.get('dependency_id')} sem campos {sorted(falta)}")
            continue
        if not re.match(r"^DEP-COP-\d{3}$", a["dependency_id"]):
            r.erro(f"grafo: dependency_id fora do padrão: {a['dependency_id']}")
        if a["dependency_id"] in dep_ids:
            r.erro(f"grafo: dependency_id duplicado {a['dependency_id']}")
        dep_ids.add(a["dependency_id"])
        for lado in ("source_artifact_id", "target_artifact_id"):
            if a[lado] not in nos:
                r.erro(f"grafo: {a['dependency_id']}.{lado} inexistente: {a[lado]}")
        if a["status_epistemico"] not in EPISTEMIC:
            r.erro(f"grafo: {a['dependency_id']} com status_epistemico inválido")
        if not str(a["justificativa"]).strip():
            r.erro(f"grafo: {a['dependency_id']} sem justificativa")
        if not isinstance(a["mandatory"], bool):
            r.erro(f"grafo: {a['dependency_id']}.mandatory deve ser booleano")
        pares_arestas.add((a["source_artifact_id"], a["target_artifact_id"]))
    if pares_nos != pares_arestas:
        r.erro(f"grafo: depende_de dos nós ≠ arestas (só nós: {sorted(pares_nos - pares_arestas)}; só arestas: {sorted(pares_arestas - pares_nos)})")
    achados = ciclos(nos)
    for c in achados:
        r.erro(f"grafo: ciclo detectado {' → '.join(c)}")
    if not achados:
        r.ok.append(f"grafo: {len(nos)} nós, {len(dep_ids)} arestas, sem ciclos")
    return nos


def checar_commands(raiz: Path, ids: dict[str, str], rotas: dict[str, dict], r: Relatorio) -> None:
    pasta = raiz / "commands"
    arquivos = {p.stem: p for p in pasta.glob("*.md")} if pasta.exists() else {}
    for cv, slash in ids.items():
        nome = slash.lstrip("/")
        if nome not in arquivos:
            r.erro(f"command: {cv} ({slash}) sem commands/{nome}.md")
    for nome, p in arquivos.items():
        texto = p.read_text(encoding="utf-8")
        fm, corpo = frontmatter(texto)
        if not fm or not campo(fm, "description"):
            r.erro(f"command: {p.name} sem frontmatter/description")
        elif len(campo(fm, "description").strip('"')) > 60:
            r.aviso(f"command: {p.name} description > 60 caracteres")
        citados = set(re.findall(r"CV-[A-Z]+-\d{3}", corpo))
        proprio = [cv for cv in citados if ids.get(cv) == f"/{nome}"]
        if len(proprio) != 1:
            r.erro(f"command: {p.name} deve citar exatamente o próprio ID (achados: {sorted(citados)})")
            continue
        cv = proprio[0]
        if NUCLEO not in corpo:
            r.erro(f"command: {p.name} não referencia {NUCLEO}")
        if rotas[cv]["visual"] and TOKEN not in corpo:
            r.erro(f"command: {p.name} é visual e não referencia {TOKEN}")
        if rotas[cv]["busca"] and not BUSCA.search(corpo):
            r.erro(f"command: {p.name} deve declarar busca web")
    r.ok.append(f"commands: {len(arquivos)} arquivos")


def checar_skills(raiz: Path, nos: dict[str, dict], r: Relatorio) -> None:
    por_modulo = {no["modulo"].split(":", 1)[1]: no for no in nos.values() if no["modulo"].startswith("executar-cop:")}
    achadas = 0
    for skill in sorted((raiz / "skills").glob("*/SKILL.md")):
        achadas += 1
        nome_dir = skill.parent.name
        fm, corpo = frontmatter(skill.read_text(encoding="utf-8"))
        nome = campo(fm, "name")
        if nome != nome_dir:
            r.erro(f"skill: {nome_dir}/SKILL.md com name '{nome}' ≠ diretório")
        if not descricao(fm):
            r.erro(f"skill: {nome_dir} sem description")
        if NUCLEO not in corpo:
            r.erro(f"skill: {nome_dir} não referencia {NUCLEO}")
        no = por_modulo.get(nome_dir)
        if no is None:
            r.erro(f"skill: {nome_dir} sem nó no grafo")
            continue
        if not no["cv_ids"]:
            r.erro(f"skill: {nome_dir} sem ID verbal (cobertura total exigida)")
        if no["saida_visual"] and TOKEN not in corpo:
            r.erro(f"skill: {nome_dir} tem saída visual e não referencia {TOKEN}")
        if no["camada"] in (2, 3) and not BUSCA.search(corpo):
            r.erro(f"skill: {nome_dir} (camada {no['camada']}) deve declarar busca web")
    for modulo in por_modulo:
        if not (raiz / "skills" / modulo / "SKILL.md").exists():
            r.erro(f"skill: nó do grafo aponta para skills/{modulo}/SKILL.md inexistente")
    r.ok.append(f"skills: {achadas}")


def checar_agentes(raiz: Path, r: Relatorio) -> None:
    arquivos = sorted((raiz / "agents").glob("*.md"))
    if not arquivos:
        r.erro("agentes: nenhum agente em agents/")
    for p in arquivos:
        fm, corpo = frontmatter(p.read_text(encoding="utf-8"))
        nome = campo(fm, "name")
        if not nome or not AGENT_NAME.match(nome) or nome != p.stem:
            r.erro(f"agente: {p.name} com name inválido ou ≠ arquivo ({nome})")
        desc = descricao(fm)
        if "<example>" not in desc:
            r.erro(f"agente: {p.name} sem <example> na description")
        if campo(fm, "model") not in MODELS:
            r.erro(f"agente: {p.name} com model inválido ({campo(fm, 'model')})")
        if campo(fm, "color") not in COLORS:
            r.erro(f"agente: {p.name} com color inválida ({campo(fm, 'color')})")
        tools = campo(fm, "tools")
        if not tools or not tools.startswith("["):
            r.erro(f"agente: {p.name} sem tools em lista")
        if NUCLEO not in corpo:
            r.erro(f"agente: {p.name} não referencia {NUCLEO}")
        if not BUSCA.search(corpo):
            r.erro(f"agente: {p.name} deve declarar busca web")
        if TOKEN not in corpo:
            r.erro(f"agente: {p.name} deve referenciar {TOKEN} para saídas visuais")
    r.ok.append(f"agentes: {len(arquivos)}")


def main() -> int:
    raiz = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parents[1]
    r = Relatorio()
    for obrig in ("references/" + NUCLEO, "assets/design-tokens/" + TOKEN,
                  "assets/design-tokens/calendario-light-mode-preview.png", ".claude-plugin/plugin.json"):
        if not (raiz / obrig).exists():
            r.erro(f"arquivo obrigatório ausente: {obrig}")
    ids, rotas = ler_indice(raiz, r)
    nos = ler_grafo(raiz, ids, rotas, r)
    checar_commands(raiz, ids, rotas, r)
    checar_skills(raiz, nos, r)
    checar_agentes(raiz, r)
    for m in r.ok:
        print(f"OK     {m}")
    for m in r.avisos:
        print(f"AVISO  {m}")
    for m in r.erros:
        print(f"ERRO   {m}")
    print(f"\nResultado: {len(r.erros)} erro(s), {len(r.avisos)} aviso(s)")
    return 1 if r.erros else 0


if __name__ == "__main__":
    sys.exit(main())
