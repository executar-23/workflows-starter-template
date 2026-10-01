#!/usr/bin/env python3
"""Converte um .docx em Markdown preservando títulos, listas e TABELAS (etapa 01).

Somente stdlib (zipfile + xml.etree). Não reescreve conteúdo: só normaliza.
Uso: python3 docx_to_md.py entrada.docx saida.md
Também imprime um índice de tabelas (Tabela N: linhas × colunas, cabeçalho).
"""
import re
import sys
import zipfile
import xml.etree.ElementTree as ET

W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"


def text_of(el):
    parts = []
    for node in el.iter():
        if node.tag == W + "t":
            parts.append(node.text or "")
        elif node.tag == W + "tab":
            parts.append("\t")
        elif node.tag in (W + "br", W + "cr"):
            parts.append(" ")
    return "".join(parts).strip()


def style_of(p):
    ppr = p.find(W + "pPr")
    if ppr is None:
        return "", False
    st = ppr.find(W + "pStyle")
    numbered = ppr.find(W + "numPr") is not None
    return (st.get(W + "val") if st is not None else ""), numbered


def cell_text(tc):
    return " ".join(t for t in (text_of(p) for p in tc.iter(W + "p")) if t).replace("|", "\\|")


def table_md(tbl):
    rows = []
    for tr in tbl.findall(W + "tr"):
        rows.append([cell_text(tc) for tc in tr.findall(W + "tc")])
    if not rows:
        return "", rows
    width = max(len(r) for r in rows)
    rows = [r + [""] * (width - len(r)) for r in rows]
    out = ["| " + " | ".join(rows[0]) + " |", "|" + "---|" * width]
    out += ["| " + " | ".join(r) + " |" for r in rows[1:]]
    return "\n".join(out), rows


def convert(path):
    with zipfile.ZipFile(path) as z:
        root = ET.fromstring(z.read("word/document.xml"))
    body = root.find(W + "body")
    blocks, tables = [], []
    for el in body:
        if el.tag == W + "p":
            txt = text_of(el)
            if not txt:
                continue
            style, numbered = style_of(el)
            m = re.match(r"(?i)(heading|ttulo|titulo|título)\s*(\d)", style)
            if m:
                blocks.append("#" * min(int(m.group(2)), 6) + " " + txt)
            elif style.lower() in ("title", "ttulo", "titulo"):
                blocks.append("# " + txt)
            elif numbered or style.lower().startswith("list"):
                blocks.append("- " + txt)
            else:
                blocks.append(txt)
        elif el.tag == W + "tbl":
            md, rows = table_md(el)
            if md:
                tables.append(rows)
                blocks.append(f"<!-- Tabela {len(tables)} -->\n" + md)
    return "\n\n".join(blocks) + "\n", tables


def main():
    if len(sys.argv) != 3:
        sys.exit("uso: docx_to_md.py entrada.docx saida.md")
    md, tables = convert(sys.argv[1])
    with open(sys.argv[2], "w", encoding="utf-8") as f:
        f.write(md)
    print(f"OK: {sys.argv[2]} ({len(md.splitlines())} linhas, {len(tables)} tabelas)")
    for i, rows in enumerate(tables, 1):
        print(f"  Tabela {i}: {len(rows)} linhas × {len(rows[0]) if rows else 0} colunas · cabeçalho: {' | '.join(rows[0])[:120]}")


if __name__ == "__main__":
    main()
