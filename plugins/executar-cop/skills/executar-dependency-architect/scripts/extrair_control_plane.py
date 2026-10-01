#!/usr/bin/env python3
"""Extrai o EXECUTAR_HUB_Control_Plane (.xlsx) para JSON, sem interpretar conteúdo.

Somente stdlib (zipfile + XML). Lê TODAS as abas, com os valores em cache das fórmulas,
e confere as abas de leitura obrigatória do prompt mestre EXECUTAR-DEPENDENCY-ARCHITECT-001.

Uso:
  python3 extrair_control_plane.py <arquivo.xlsx> <saida.json>

Saída JSON:
  {
    "arquivo": str,
    "sha256": str,
    "abas": { nome: {"cabecalho": [...], "registros": [{col: valor}], "linhas_brutas": [[...]], "total_registros": int} },
    "obrigatorias": {"presentes": [...], "ausentes": [...]}
  }
O cabeçalho é a primeira linha não vazia. Valores vazios são omitidos dos registros.
"""
from __future__ import annotations

import hashlib
import json
import re
import sys
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
      "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
      "pr": "http://schemas.openxmlformats.org/package/2006/relationships"}

OBRIGATORIAS_EXATAS = [
    "00_Leia-me", "10_REG_Macroareas", "11_REG_Dominios", "12_REG_Portfolio", "14_REG_Artefatos",
    "15_REG_Campos", "16_REG_Dependencias", "17_REG_Gates", "18_REG_Evidencias", "19_REG_Documentos",
    "20_REG_Decisoes", "21_REG_Gaps", "22_REG_Conflitos", "24_REG_Sources", "README_MASTER_INDEX_EXECUTAR",
]
# "01_Formulario_A00 até 01_Formulario_A12" e "02_Visao_Programa até 09_Indice_IDs"
FORMULARIOS = [f"01_Formulario_A{n:02d}" for n in range(13)]
FAIXA_02_09 = re.compile(r"^0[2-9]_")


def col_idx(ref: str) -> int:
    letras = re.match(r"[A-Z]+", ref).group(0)
    n = 0
    for ch in letras:
        n = n * 26 + (ord(ch) - 64)
    return n - 1


def texto_rico(el: ET.Element) -> str:
    return "".join(t.text or "" for t in el.iter(f"{{{NS['m']}}}t"))


def ler_xlsx(caminho: Path) -> dict[str, list[list]]:
    with zipfile.ZipFile(caminho) as z:
        nomes = set(z.namelist())
        wb = ET.fromstring(z.read("xl/workbook.xml"))
        rels = ET.fromstring(z.read("xl/_rels/workbook.xml.rels"))
        alvo = {r.get("Id"): r.get("Target") for r in rels.findall("pr:Relationship", NS)}
        caminho_ss = next((("xl/" + r.get("Target").lstrip("/")).replace("xl/xl/", "xl/")
                           for r in rels.findall("pr:Relationship", NS) if r.get("Type", "").endswith("/sharedStrings")),
                          "xl/sharedStrings.xml")
        compartilhadas: list[str] = []
        if caminho_ss in nomes:
            raiz = ET.fromstring(z.read(caminho_ss))
            compartilhadas = [texto_rico(si) for si in raiz.findall("m:si", NS)]
        abas: dict[str, list[list]] = {}
        for sh in wb.find("m:sheets", NS).findall("m:sheet", NS):
            rid = sh.get(f"{{{NS['r']}}}id")
            destino = alvo[rid].lstrip("/")
            caminho_aba = destino if destino.startswith("xl/") else f"xl/{destino}"
            raiz = ET.fromstring(z.read(caminho_aba))
            linhas: list[list] = []
            for row in raiz.iter(f"{{{NS['m']}}}row"):
                valores: dict[int, object] = {}
                for c in row.findall("m:c", NS):
                    tipo = c.get("t")
                    v = c.find("m:v", NS)
                    if tipo == "s" and v is not None:
                        val: object = compartilhadas[int(v.text)]
                    elif tipo == "inlineStr":
                        is_ = c.find("m:is", NS)
                        val = texto_rico(is_) if is_ is not None else ""
                    elif tipo == "b" and v is not None:
                        val = v.text == "1"
                    elif v is not None and v.text is not None:
                        txt = v.text
                        try:
                            num = float(txt)
                            val = int(num) if num.is_integer() and tipo != "str" else (txt if tipo == "str" else num)
                        except ValueError:
                            val = txt
                    else:
                        continue
                    valores[col_idx(c.get("r"))] = val
                if valores:
                    largura = max(valores) + 1
                    linhas.append([valores.get(i, "") for i in range(largura)])
            abas[sh.get("name")] = linhas
        return abas


def estruturar(linhas: list[list]) -> dict:
    nao_vazias = [l for l in linhas if any(str(x).strip() for x in l)]
    if not nao_vazias:
        return {"cabecalho": [], "registros": [], "linhas_brutas": [], "total_registros": 0}
    cab = [str(x).strip() for x in nao_vazias[0]]
    registros = []
    for l in nao_vazias[1:]:
        reg = {}
        for i, val in enumerate(l):
            chave = cab[i] if i < len(cab) and cab[i] else f"col_{i + 1}"
            if str(val).strip() != "":
                reg[chave] = val
        if reg:
            registros.append(reg)
    return {"cabecalho": cab, "registros": registros, "linhas_brutas": nao_vazias, "total_registros": len(registros)}


def conferir_obrigatorias(nomes: list[str]) -> dict:
    presentes, ausentes = [], []
    for n in OBRIGATORIAS_EXATAS + FORMULARIOS:
        (presentes if n in nomes else ausentes).append(n)
    faixa = sorted(n for n in nomes if FAIXA_02_09.match(n))
    if faixa:
        presentes.extend(faixa)
    else:
        ausentes.append("02_Visao_Programa até 09_Indice_IDs (nenhuma aba 02_–09_)")
    return {"presentes": presentes, "ausentes": ausentes}


def main() -> int:
    if len(sys.argv) != 3:
        print(__doc__)
        return 2
    origem, destino = Path(sys.argv[1]), Path(sys.argv[2])
    abas = ler_xlsx(origem)
    saida = {
        "arquivo": origem.name,
        "sha256": hashlib.sha256(origem.read_bytes()).hexdigest(),
        "abas": {nome: estruturar(linhas) for nome, linhas in abas.items()},
        "obrigatorias": conferir_obrigatorias(list(abas)),
    }
    destino.write_text(json.dumps(saida, ensure_ascii=False, indent=2), encoding="utf-8")
    ob = saida["obrigatorias"]
    print(f"abas lidas: {len(abas)}; registros: {sum(a['total_registros'] for a in saida['abas'].values())}")
    print(f"obrigatórias presentes: {len(ob['presentes'])}; ausentes: {len(ob['ausentes'])}")
    for a in ob["ausentes"]:
        print(f"  GAP: aba obrigatória ausente — {a}")
    print(f"json: {destino}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
