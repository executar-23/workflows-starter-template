#!/usr/bin/env python3
"""Gera um Control Plane FICTÍCIO (.xlsx) para testes. Somente stdlib.

ATENÇÃO: todos os dados são inventados e NÃO representam o EXECUTAR_HUB_Control_Plane_v2.xlsx real.
Casos embutidos de propósito:
  - 12_REG_Portfolio e 01_Formulario_A07..A12 ausentes (GAP de leitura obrigatória);
  - dependência documentada (DIRECT) em 16_REG (A00→A01), em 19_REG_Documentos (A02→A03) e em 20_REG_Decisoes (A04→A05);
  - dependências demonstráveis por campo (coluna consome_campo em 15_REG_Campos) → DERIVED;
  - ciclo A03 ↔ A04 via campos (C-A03-02 consome C-A04-02; C-A04-01 consome C-A03-01);
  - conflito A05 → A06 (DEC-02 × DOC-02) → CONFLICT.

Uso: python3 gerar_control_plane_ficticio.py <saida.xlsx> [--shared]
  --shared  grava textos em xl/sharedStrings.xml (como o Excel faz) em vez de inlineStr.
"""
from __future__ import annotations

import sys
import zipfile
from xml.sax.saxutils import escape

AVISO = "FIXTURE FICTÍCIA — dados inventados apenas para teste; não representam o EXECUTAR HUB real."

ABAS: dict[str, list[list[str]]] = {
    "00_Leia-me": [["aviso"], [AVISO], ["Versão reduzida: artefatos A00–A06, 14 campos."]],
    "02_Visao_Programa": [["programa", "objetivo"], ["PRG-FICT", "Lançar produto fictício"]],
    "09_Indice_IDs": [["id", "tipo"], ["A00", "artefato"], ["G-01", "gate"]],
    "10_REG_Macroareas": [["macroarea_id", "nome"], ["MA-01", "Produto"], ["MA-02", "Engenharia"], ["MA-03", "Operação"]],
    "11_REG_Dominios": [["domain_id", "nome", "macroarea_id"],
                        ["D01", "Estratégia", "MA-01"], ["D02", "Requisitos", "MA-01"],
                        ["D03", "Arquitetura", "MA-02"], ["D04", "Qualidade", "MA-02"], ["D05", "Lançamento", "MA-03"]],
    "14_REG_Artefatos": [["artifact_id", "nome", "domain_id"],
                         ["A00", "Visão do programa", "D01"], ["A01", "Problema e oportunidade", "D01"],
                         ["A02", "Requisitos", "D02"], ["A03", "Handoff Produto → Engenharia", "D02"],
                         ["A04", "Arquitetura", "D03"], ["A05", "Plano de testes", "D04"],
                         ["A06", "Plano de lançamento", "D05"]],
    "15_REG_Campos": [["campo_id", "artifact_id", "campo", "consome_campo"],
                      ["C-A00-01", "A00", "Visão do programa", ""],
                      ["C-A00-02", "A00", "Público-alvo", ""],
                      ["C-A01-01", "A01", "Problema central", "C-A00-02"],
                      ["C-A01-02", "A01", "Métrica de sucesso", ""],
                      ["C-A02-01", "A02", "Requisitos funcionais", "C-A01-01"],
                      ["C-A02-02", "A02", "Critérios de aceite", "C-A01-02"],
                      ["C-A03-01", "A03", "Escopo aprovado para engenharia", "C-A02-01"],
                      ["C-A03-02", "A03", "Restrições técnicas conhecidas", "C-A04-02"],
                      ["C-A04-01", "A04", "Arquitetura de alto nível", "C-A03-01"],
                      ["C-A04-02", "A04", "Stack e restrições", ""],
                      ["C-A05-01", "A05", "Casos de teste", "C-A02-02"],
                      ["C-A05-02", "A05", "Ambiente de testes", "C-A04-01"],
                      ["C-A06-01", "A06", "Data de lançamento", ""],
                      ["C-A06-02", "A06", "Canais de comunicação", "C-A00-02"]],
    "16_REG_Dependencias": [["dependency_id", "source_artifact_id", "target_artifact_id", "relation", "mandatory",
                             "gate_id", "required_status", "status"],
                            ["DEP-001", "A00", "A01", "produz_insumo", "TRUE", "G-01", "concluido", "ativo"]],
    "17_REG_Gates": [["gate_id", "nome", "artefatos_exigidos"],
                     ["G-01", "Produto definido", "A00;A01;A02"], ["G-02", "Handoff aprovado", "A03"],
                     ["G-03", "Engenharia pronta", "A04;A05"], ["G-04", "Go-live", "A06"]],
    "18_REG_Evidencias": [["evidencia_id", "artifact_id", "descricao"], ["E-01", "A02", "Requisitos revisados"]],
    "19_REG_Documentos": [["doc_id", "titulo", "trecho"],
                          ["DOC-01", "Guia do handoff", "O A03 só é emitido depois que os requisitos (A02) estiverem aprovados no G-01."],
                          ["DOC-02", "Nota de lançamento", "O plano de lançamento (A06) é independente do plano de testes (A05)."]],
    "20_REG_Decisoes": [["decisao_id", "texto"],
                        ["DEC-01", "O plano de testes (A05) só começa após a arquitetura (A04)."],
                        ["DEC-02", "O plano de lançamento (A06) depende do plano de testes (A05)."]],
    "21_REG_Gaps": [["gap_id", "descricao"], ["GAP-01", "Dono do A06 indefinido."]],
    "22_REG_Conflitos": [["conflito_id", "descricao"], ["CF-00", "Nenhum conflito registrado previamente."]],
    "24_REG_Sources": [["source_id", "descricao"], ["SRC-01", AVISO]],
    "README_MASTER_INDEX_EXECUTAR": [["aviso"], [AVISO]],
}
for n in range(7):
    ABAS[f"01_Formulario_A{n:02d}"] = [["campo_id", "pergunta"], [f"C-A{n:02d}-01", f"Pergunta fictícia do A{n:02d}"]]


def col(n: int) -> str:
    s = ""
    n += 1
    while n:
        n, r = divmod(n - 1, 26)
        s = chr(65 + r) + s
    return s


def celula(ref: str, v: str, compartilhadas: list[str] | None) -> str:
    if compartilhadas is None:
        return f'<c r="{ref}" t="inlineStr"><is><t xml:space="preserve">{escape(v)}</t></is></c>'
    if v not in compartilhadas:
        compartilhadas.append(v)
    return f'<c r="{ref}" t="s"><v>{compartilhadas.index(v)}</v></c>'


def aba_xml(linhas: list[list[str]], compartilhadas: list[str] | None) -> str:
    rows = []
    for i, linha in enumerate(linhas, start=1):
        cells = "".join(celula(f"{col(j)}{i}", str(v), compartilhadas) for j, v in enumerate(linha) if str(v) != "")
        rows.append(f'<row r="{i}">{cells}</row>')
    return ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
            f'<sheetData>{"".join(rows)}</sheetData></worksheet>')


def gerar(destino: str, shared: bool = False) -> None:
    nomes = sorted(ABAS)
    compartilhadas: list[str] | None = [] if shared else None
    with zipfile.ZipFile(destino, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("[Content_Types].xml",
                   '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                   '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
                   '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
                   '<Default Extension="xml" ContentType="application/xml"/>'
                   '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
                   + "".join(f'<Override PartName="/xl/worksheets/sheet{i}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
                             for i in range(1, len(nomes) + 1))
                   + ('<Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>'
                      if shared else '')
                   + '</Types>')
        z.writestr("_rels/.rels",
                   '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                   '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
                   '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'
                   '</Relationships>')
        z.writestr("xl/workbook.xml",
                   '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                   '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" '
                   'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>'
                   + "".join(f'<sheet name="{escape(n)}" sheetId="{i}" r:id="rId{i}"/>' for i, n in enumerate(nomes, start=1))
                   + '</sheets></workbook>')
        z.writestr("xl/_rels/workbook.xml.rels",
                   '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                   '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
                   + "".join(f'<Relationship Id="rId{i}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet{i}.xml"/>'
                             for i in range(1, len(nomes) + 1))
                   + (f'<Relationship Id="rId{len(nomes) + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>'
                      if shared else '')
                   + '</Relationships>')
        for i, n in enumerate(nomes, start=1):
            z.writestr(f"xl/worksheets/sheet{i}.xml", aba_xml(ABAS[n], compartilhadas))
        if compartilhadas is not None:
            z.writestr("xl/sharedStrings.xml",
                       '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                       f'<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="{len(compartilhadas)}">'
                       + "".join(f'<si><t xml:space="preserve">{escape(s)}</t></si>' for s in compartilhadas)
                       + '</sst>')


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if a != "--shared"]
    if len(args) != 1:
        print(__doc__)
        sys.exit(2)
    gerar(args[0], shared="--shared" in sys.argv)
    print(f"fixture fictícia: {args[0]}")
