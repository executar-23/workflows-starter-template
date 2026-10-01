#!/usr/bin/env python3
"""Injeta arvore-visual.json no componente Executar · Árvore Visual v1.0 (etapa 05).

Uso: python3 render_arvore_visual.py arvore-visual.json arvore-visual.html
O template (assets/arvore-visual-template.html) já segue o token visual do calendário;
só o bloco `const ARVORE = {...};` é trocado. O conteúdo não é reescrito.
"""
import html
import json
import re
import sys
from pathlib import Path

TEMPLATE = Path(__file__).resolve().parent.parent / "assets" / "arvore-visual-template.html"


def main():
    if len(sys.argv) != 3:
        sys.exit("uso: render_arvore_visual.py arvore-visual.json saida.html")
    tree = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    src = TEMPLATE.read_text(encoding="utf-8")
    data = json.dumps(tree, ensure_ascii=False, indent=1).replace("</", "<\\/")
    out, n = re.subn(r"const ARVORE = \{.*?\n\};\n", lambda _m: f"const ARVORE = {data};\n", src, count=1, flags=re.S)
    if n != 1:
        sys.exit("template sem o bloco `const ARVORE = {...};`")
    title = html.escape(str(tree.get("titulo", "Árvore Visual")))
    out = re.sub(r"<title>.*?</title>", f"<title>{title} · Executar · Árvore Visual</title>", out, count=1, flags=re.S)
    Path(sys.argv[2]).write_text(out, encoding="utf-8")
    print(f"OK: {sys.argv[2]}")


if __name__ == "__main__":
    main()
