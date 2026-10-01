#!/usr/bin/env python3
"""Valida o Registro Formal de Dependências (16_REG_Dependencias) e a Arquitetura de Preenchimento.

Somente stdlib. Não inventa nem corrige nada: aponta erros (bloqueiam a entrega) e avisos.

Uso:
  python3 validar_registro.py --registro registro.csv --anexo anexo.csv \
      [--control-plane control_plane.json] [--fases fases.json] \
      [--col-artefato NOME] [--col-gate NOME] [--col-campo-artefato NOME]

Formatos:
  registro  CSV (cabeçalho = schema exato, na ordem) ou JSON (lista de objetos com as 8 chaves).
  anexo     CSV/JSON com dependency_id, status_epistemico, justificativa (fonte para DIRECT).
  fases     JSON: [{"fase": "F1", "artefatos": ["A00", "A01"]}, ...] na ordem de execução.
  control-plane  JSON gerado por extrair_control_plane.py.
"""
from __future__ import annotations

import argparse
import csv
import json
import re
import sys
from collections import defaultdict
from pathlib import Path

SCHEMA = ["dependency_id", "source_artifact_id", "target_artifact_id", "relation", "mandatory",
          "gate_id", "required_status", "status"]
EPISTEMIC = {"DIRECT", "DERIVED", "PROPOSED", "CONFLICT", "GAP"}
VERDADE = {"true", "sim", "yes", "1", "x", "verdadeiro", "s"}
FALSO = {"false", "não", "nao", "no", "0", "falso", "n"}
PADROES_ARTEFATO = [r"artifact_id", r"artefato_id", r"id_artefato", r"artifact", r"artefato", r"id"]
PADROES_GATE = [r"gate_id", r"id_gate", r"gate", r"id"]
PADROES_CAMPO_ARTEFATO = [r"artifact_id", r"artefato_id", r"id_artefato", r"artefato", r"artifact"]


class Relatorio:
    def __init__(self) -> None:
        self.erros: list[str] = []
        self.avisos: list[str] = []
        self.info: list[str] = []


def ler_tabela(caminho: Path) -> tuple[list[str], list[dict]]:
    if caminho.suffix.lower() == ".json":
        dados = json.loads(caminho.read_text(encoding="utf-8"))
        if isinstance(dados, dict):
            dados = dados.get("linhas") or dados.get("registros") or []
        cab = list(dados[0].keys()) if dados else []
        return cab, [{k: ("" if v is None else v) for k, v in d.items()} for d in dados]
    with caminho.open(encoding="utf-8-sig", newline="") as f:
        leitor = csv.DictReader(f)
        return list(leitor.fieldnames or []), [dict(l) for l in leitor]


def detectar(cab: list[str], padroes: list[str], forcado: str | None, aba: str, r: Relatorio) -> str | None:
    if forcado:
        if forcado not in cab:
            r.erros.append(f"{aba}: coluna '{forcado}' não existe (cabeçalho: {cab})")
            return None
        return forcado
    for p in padroes:
        for c in cab:
            if re.fullmatch(p, c.strip(), re.I):
                r.info.append(f"{aba}: coluna de ID detectada = '{c}'")
                return c
    if cab:
        r.avisos.append(f"{aba}: coluna de ID não reconhecida; usando a primeira ('{cab[0]}'). Use a opção --col-* para fixar.")
        return cab[0]
    return None


def bool_mandatory(valor, did: str, r: Relatorio) -> bool | None:
    if isinstance(valor, bool):
        return valor
    s = str(valor).strip().lower()
    if s in VERDADE:
        return True
    if s in FALSO:
        return False
    r.erros.append(f"{did}: mandatory '{valor}' fora do domínio booleano (bloqueante/informativa)")
    return None


def ciclos(arestas: dict[str, set[str]]) -> list[list[str]]:
    achados, cor, pilha = [], defaultdict(int), []

    def visitar(n: str) -> None:
        cor[n] = 1
        pilha.append(n)
        for m in sorted(arestas.get(n, ())):
            if cor[m] == 1:
                achados.append(pilha[pilha.index(m):] + [m])
            elif cor[m] == 0:
                visitar(m)
        pilha.pop()
        cor[n] = 2

    for n in sorted(set(arestas) | {m for v in arestas.values() for m in v}):
        if cor[n] == 0:
            visitar(n)
    return achados


def camadas(nos: set[str], arestas: dict[str, set[str]]) -> list[list[str]]:
    grau = {n: 0 for n in nos}
    for s, alvos in arestas.items():
        for t in alvos:
            if t in grau:
                grau[t] += 1
    resultado, atual = [], sorted(n for n, g in grau.items() if g == 0)
    vistos = set()
    while atual:
        resultado.append(atual)
        vistos.update(atual)
        prox = set()
        for s in atual:
            for t in arestas.get(s, ()):
                if t in grau:
                    grau[t] -= 1
                    if grau[t] == 0:
                        prox.add(t)
        atual = sorted(prox - vistos)
    return resultado


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--registro", required=True, type=Path)
    ap.add_argument("--anexo", required=True, type=Path)
    ap.add_argument("--control-plane", type=Path)
    ap.add_argument("--fases", type=Path)
    ap.add_argument("--col-artefato")
    ap.add_argument("--col-gate")
    ap.add_argument("--col-campo-artefato")
    a = ap.parse_args()
    r = Relatorio()

    cab, linhas = ler_tabela(a.registro)
    if cab != SCHEMA:
        r.erros.append(f"registro: cabeçalho deve ser exatamente {SCHEMA} (recebido {cab})")
    ids: dict[str, dict] = {}
    for i, l in enumerate(linhas, start=2):
        did = str(l.get("dependency_id", "")).strip()
        if not did:
            r.erros.append(f"registro linha {i}: dependency_id vazio")
            continue
        if did in ids:
            r.erros.append(f"registro: dependency_id duplicado {did}")
        ids[did] = l
        for campo in ("source_artifact_id", "target_artifact_id", "relation", "mandatory", "required_status", "status"):
            if str(l.get(campo, "")).strip() == "":
                r.erros.append(f"{did}: campo obrigatório vazio '{campo}' (linha incompleta)")
        if str(l.get("gate_id", "")).strip() == "":
            r.avisos.append(f"{did}: sem gate_id (registrar gate:tbd se o Gate não for aplicável/conhecido)")
        if str(l.get("source_artifact_id")).strip() == str(l.get("target_artifact_id")).strip():
            r.erros.append(f"{did}: source e target iguais")

    _, anexo = ler_tabela(a.anexo)
    por_id = {str(x.get("dependency_id", "")).strip(): x for x in anexo}
    for did in ids:
        x = por_id.get(did)
        if x is None:
            r.erros.append(f"{did}: sem linha no anexo epistêmico")
            continue
        tag = str(x.get("status_epistemico", "")).strip().upper()
        just = str(x.get("justificativa", "")).strip()
        if tag not in EPISTEMIC:
            r.erros.append(f"{did}: status_epistemico inválido '{tag}'")
        elif tag == "GAP":
            r.erros.append(f"{did}: relação GAP não vira linha do registro (informação insuficiente)")
        elif not just:
            r.erros.append(f"{did}: {tag} sem justificativa rastreável/fonte")
        if tag == "CONFLICT":
            r.avisos.append(f"{did}: CONFLICT exige decisão humana antes da inserção")
        if tag == "PROPOSED":
            r.avisos.append(f"{did}: PROPOSED exige validação humana")
    for did in por_id:
        if did and did not in ids:
            r.avisos.append(f"anexo: {did} não está no registro (ok para GAP/CONFLICT fora do registro)")

    obrig: dict[str, set[str]] = defaultdict(set)
    todas: dict[str, set[str]] = defaultdict(set)
    artefatos_citados = set()
    for did, l in ids.items():
        s, t = str(l.get("source_artifact_id")).strip(), str(l.get("target_artifact_id")).strip()
        artefatos_citados |= {s, t}
        todas[s].add(t)
        if bool_mandatory(l.get("mandatory"), did, r):
            obrig[s].add(t)

    artefatos = set(artefatos_citados)
    campos_por_artefato: dict[str, int] = {}
    if a.control_plane:
        cp = json.loads(a.control_plane.read_text(encoding="utf-8"))
        abas = cp.get("abas", {})
        for ausente in cp.get("obrigatorias", {}).get("ausentes", []):
            r.avisos.append(f"GAP: aba obrigatória ausente no control plane — {ausente}")
        art = abas.get("14_REG_Artefatos")
        if art:
            col = detectar(art["cabecalho"], PADROES_ARTEFATO, a.col_artefato, "14_REG_Artefatos", r)
            canon = {str(x.get(col, "")).strip() for x in art["registros"] if str(x.get(col, "")).strip()}
            for did, l in ids.items():
                for lado in ("source_artifact_id", "target_artifact_id"):
                    v = str(l.get(lado, "")).strip()
                    if v and v not in canon:
                        r.erros.append(f"{did}: {lado} '{v}' não existe em 14_REG_Artefatos (IDs canônicos)")
            artefatos = canon
        else:
            r.erros.append("control plane sem 14_REG_Artefatos")
        gates = abas.get("17_REG_Gates")
        if gates:
            colg = detectar(gates["cabecalho"], PADROES_GATE, a.col_gate, "17_REG_Gates", r)
            gids = {str(x.get(colg, "")).strip() for x in gates["registros"]}
            for did, l in ids.items():
                g = str(l.get("gate_id", "")).strip()
                if g and g.lower() != "gate:tbd" and g not in gids:
                    r.erros.append(f"{did}: gate_id '{g}' não existe em 17_REG_Gates")
        existentes = abas.get("16_REG_Dependencias", {}).get("registros", [])
        for ex in existentes:
            eid = str(ex.get("dependency_id", "")).strip()
            if eid in ids:
                novo = ids[eid]
                if (str(novo.get("source_artifact_id")).strip(), str(novo.get("target_artifact_id")).strip()) != \
                        (str(ex.get("source_artifact_id", "")).strip(), str(ex.get("target_artifact_id", "")).strip()):
                    r.erros.append(f"{eid}: ID já existe em 16_REG com outro par source/target (preservar IDs canônicos)")
        for campo in ("required_status", "status", "relation"):
            dominio = {str(ex.get(campo, "")).strip() for ex in existentes if str(ex.get(campo, "")).strip()}
            if dominio:
                for did, l in ids.items():
                    v = str(l.get(campo, "")).strip()
                    if v and v not in dominio:
                        r.avisos.append(f"{did}: {campo} '{v}' fora do domínio já usado em 16_REG {sorted(dominio)}")
            else:
                r.avisos.append(f"GAP: domínio de valores de '{campo}' não definido pelas linhas existentes de 16_REG")
        camp = abas.get("15_REG_Campos")
        if camp:
            colc = detectar(camp["cabecalho"], PADROES_CAMPO_ARTEFATO, a.col_campo_artefato, "15_REG_Campos", r)
            for x in camp["registros"]:
                k = str(x.get(colc, "")).strip()
                if k:
                    campos_por_artefato[k] = campos_por_artefato.get(k, 0) + 1

    for c in ciclos(obrig):
        r.erros.append(f"ciclo bloqueante: {' → '.join(c)}")
    for c in ciclos(todas):
        if c not in ciclos(obrig):
            r.avisos.append(f"ciclo com dependência informativa: {' → '.join(c)}")

    if not ciclos(obrig):
        r.info.append("camadas topológicas (bloqueantes) — o que precisa existir primeiro:")
        for i, cam in enumerate(camadas(artefatos, obrig), start=1):
            r.info.append(f"  camada {i}: {', '.join(cam)}")

    if a.fases:
        fases = json.loads(a.fases.read_text(encoding="utf-8"))
        indice: dict[str, int] = {}
        for i, f in enumerate(fases):
            for art_id in f.get("artefatos", []):
                if art_id in indice:
                    r.erros.append(f"fases: artefato {art_id} aparece em mais de uma fase")
                indice[art_id] = i
        faltando = sorted(artefatos - set(indice))
        if faltando:
            r.erros.append(f"fases: artefatos sem fase: {faltando}")
        extras = sorted(set(indice) - artefatos)
        if extras and a.control_plane:
            r.erros.append(f"fases: artefatos inexistentes em 14_REG_Artefatos: {extras}")
        for s, alvos in obrig.items():
            for t in alvos:
                if s in indice and t in indice and indice[s] > indice[t]:
                    r.erros.append(f"fases: {t} ({fases[indice[t]]['fase']}) vem antes de sua dependência bloqueante {s} ({fases[indice[s]]['fase']})")
        if campos_por_artefato:
            total = sum(campos_por_artefato.values())
            cobertos = 0
            for f in fases:
                n = sum(campos_por_artefato.get(x, 0) for x in f.get("artefatos", []))
                cobertos += n
                r.info.append(f"  {f.get('fase')}: {n} campos")
            r.info.append(f"cobertura de campos: {cobertos}/{total}")
            if cobertos != total:
                r.erros.append(f"fases: cobertura de campos {cobertos}/{total} — há campos sem fase")

    for m in r.info:
        print(f"INFO   {m}")
    for m in r.avisos:
        print(f"AVISO  {m}")
    for m in r.erros:
        print(f"ERRO   {m}")
    print(f"\nResultado: {len(ids)} dependência(s); {len(r.erros)} erro(s), {len(r.avisos)} aviso(s)")
    return 1 if r.erros else 0


if __name__ == "__main__":
    sys.exit(main())
