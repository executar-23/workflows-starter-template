#!/usr/bin/env python3
"""
Materializa estrutura.json como uma árvore FÍSICA de pastas e arquivos .txt
(um .txt por tarefa, um .txt por dia, um .txt por porta) e empacota tudo em
um .zip — a versão "diretório navegável de verdade" da árvore textual.

Uso:
    python3 render_tree_zip.py <estrutura.json> <pasta_saida> <arquivo.zip>
"""
import json
import os
import sys
import shutil
import zipfile
from collections import OrderedDict
from datetime import datetime

STATUS_SYMBOL = {"aberta": "○", "concluida": "✓", "bloqueada": "!", "marco": "◆"}
MESES_PT = [
    "", "JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO", "JULHO",
    "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO",
]
DIAS_SEMANA_PT = ["SEGUNDA", "TERCA", "QUARTA", "QUINTA", "SEXTA", "SABADO", "DOMINGO"]


def fmt_peso(v):
    s = f"{float(v):.3f}".rstrip("0").rstrip(".")
    return s.replace(".", ",") + "%"


def write(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)


def task_file_content(t, dia, ciclo_nome):
    symbol = STATUS_SYMBOL.get(t.get("status", "aberta"), "○")
    deps = t.get("depende_de") or []
    lines = [
        f"{symbol} {t['id']} — {t['titulo']}",
        "",
        f"data............ {dia['data']}",
        f"ciclo........... {ciclo_nome}",
        f"peso............ {fmt_peso(t['peso'])}",
        f"status.......... {t.get('status', 'aberta')}",
        f"depende_de...... {' + '.join(deps) if deps else '—'}",
        f"porta........... {t.get('porta') or '—'}",
        f"evidencia....... {t.get('evidencia') or '(pendente)'}",
    ]
    return "\n".join(lines) + "\n"


def build(estrutura, out_dir):
    meta = estrutura["meta"]
    root = os.path.join(out_dir, meta.get("titulo", "PROJETO"))
    if os.path.exists(root):
        shutil.rmtree(root)
    os.makedirs(root, exist_ok=True)

    visao = [
        f"OBJETIVO: {meta.get('objetivo', '')}",
        "",
        "PROGRESSO",
        f"total.............................. {fmt_peso(meta.get('total_peso', 100))}",
        f"unidades_executaveis............... {meta.get('unidades_executaveis', '')}",
        f"dias_operacionais................... {meta.get('dias_operacionais', '')}",
        f"inicio............................... {meta.get('inicio', '')}",
        f"fim................................... {meta.get('fim', '')}",
        "",
        "FLUXO_DE_VALOR",
    ]
    for f in estrutura.get("fluxos_de_valor", []):
        visao.append(f"{f['id']}_{f['nome']}: {fmt_peso(f['peso'])}")
    write(os.path.join(root, "00_VISAO_GERAL.txt"), "\n".join(visao) + "\n")

    portas_txt = []
    for p in estrutura.get("portas", []):
        portas_txt.append(f"{p['id']}/")
        for item in p.get("itens", []):
            portas_txt.append(f"  - {item}")
        if p.get("libera"):
            portas_txt.append(f"  LIBERA -> {p['libera']}")
        portas_txt.append("")
    write(os.path.join(root, "01_PORTAS_E_ENTREGAS.txt"), "\n".join(portas_txt) + "\n")

    cron_root = os.path.join(root, "02_CRONOGRAMA")
    by_month = OrderedDict()
    for dia in estrutura.get("calendario", []):
        d = datetime.strptime(dia["data"], "%Y-%m-%d")
        by_month.setdefault((d.year, d.month), []).append((d, dia))

    for (year, month), dias in by_month.items():
        month_dir = os.path.join(cron_root, f"{year}-{month:02d}_{MESES_PT[month]}")
        by_week = OrderedDict()
        for d, dia in dias:
            by_week.setdefault(d.isocalendar()[1], []).append((d, dia))
        for wi, (wk, week_dias) in enumerate(by_week.items()):
            first_day = week_dias[0][0].day
            last_day = week_dias[-1][0].day
            week_dir = os.path.join(month_dir, f"SEMANA_{wi+1:02d}_{first_day:02d}-A-{last_day:02d}")
            for d, dia in week_dias:
                nome_dia = DIAS_SEMANA_PT[d.weekday()]
                objetos = dia.get("objetos", 0)
                day_dir = os.path.join(week_dir, f"{d.day:02d}_{nome_dia}")
                if objetos == 0:
                    write(os.path.join(day_dir, "00_DIA.txt"), "LIVRE — sem execução planejada\n")
                    continue
                write(
                    os.path.join(day_dir, "00_DIA.txt"),
                    f"objetos: {objetos}\npeso_dia: {fmt_peso(dia.get('peso_dia', 0))}\n",
                )
                for ciclo_nome in ("M0", "M1", "M2", "M3", "M4", "18H"):
                    ciclo = dia.get("ciclos", {}).get(ciclo_nome, {})
                    tarefas = ciclo.get("tarefas", [])
                    if not tarefas:
                        continue
                    ciclo_dir = os.path.join(day_dir, ciclo_nome)
                    for t in tarefas:
                        write(
                            os.path.join(ciclo_dir, f"{t['id']}.txt"),
                            task_file_content(t, dia, ciclo_nome),
                        )
    return root


def zip_dir(src_dir, zip_path):
    if os.path.exists(zip_path):
        os.remove(zip_path)
    base = os.path.dirname(src_dir)
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for dirpath, _, filenames in os.walk(src_dir):
            for fn in filenames:
                full = os.path.join(dirpath, fn)
                arcname = os.path.relpath(full, base)
                zf.write(full, arcname)


def main():
    if len(sys.argv) != 4:
        print("uso: python3 render_tree_zip.py <estrutura.json> <pasta_saida> <arquivo.zip>")
        sys.exit(2)
    with open(sys.argv[1], "r", encoding="utf-8") as f:
        estrutura = json.load(f)
    root = build(estrutura, sys.argv[2])
    zip_dir(root, sys.argv[3])
    n_files = sum(len(files) for _, _, files in os.walk(root))
    print(f"árvore física gerada em: {root} ({n_files} arquivos)")
    print(f"zip gerado em: {sys.argv[3]}")


if __name__ == "__main__":
    main()
