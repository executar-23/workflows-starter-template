#!/usr/bin/env python3
"""
Renderiza estrutura.json como uma única árvore de texto plano (estilo
diretório navegável), no formato: mês → semana → dia → ciclo M0-M4 →
tarefa → dependência → peso → porta.

Uso:
    python3 render_tree_txt.py <estrutura.json> <saida.txt>
"""
import json
import sys
from collections import OrderedDict, defaultdict
from datetime import datetime

STATUS_SYMBOL = {"aberta": "○", "concluida": "✓", "bloqueada": "!", "marco": "◆"}
MESES_PT = [
    "", "JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO", "JULHO",
    "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO",
]
DIAS_SEMANA_PT = ["SEGUNDA", "TERCA", "QUARTA", "QUINTA", "SEXTA", "SABADO", "DOMINGO"]


def fmt_peso(v):
    # 1234.5 -> "1,234%"  (vírgula decimal, 3 casas quando fizer sentido)
    s = f"{float(v):.3f}".rstrip("0").rstrip(".")
    if "." not in s:
        s = s
    return s.replace(".", ",") + "%"


def week_bucket(date_obj, dias_do_mes):
    """Agrupa dias em blocos de semana simples (segunda-feira como início)."""
    return date_obj.isocalendar()[1]


def build_tree_lines(estrutura):
    meta = estrutura["meta"]
    lines = []
    root = meta.get("titulo", "PROJETO")
    lines.append(f"{root}/")
    lines.append("│")
    lines.append("├── 00_VISAO_GERAL.txt")
    lines.append("│   │")
    lines.append("│   ├── OBJETIVO/")
    lines.append(f"│   │   └── {meta.get('objetivo', '')}")
    lines.append("│   │")
    lines.append("│   ├── PROGRESSO/")
    lines.append(f"│   │   ├── total.............................. {fmt_peso(meta.get('total_peso', 100))}")
    lines.append(f"│   │   ├── unidades_executaveis............... {meta.get('unidades_executaveis', '')}")
    lines.append(f"│   │   ├── dias_operacionais................... {meta.get('dias_operacionais', '')}")
    lines.append(f"│   │   ├── inicio............................... {meta.get('inicio', '')}")
    lines.append(f"│   │   └── fim................................... {meta.get('fim', '')}")
    lines.append("│   │")
    lines.append("│   └── FLUXO_DE_VALOR/")
    fluxos = estrutura.get("fluxos_de_valor", [])
    for i, f in enumerate(fluxos):
        last = i == len(fluxos) - 1
        branch = "└──" if last else "├──"
        lines.append(f"│       {branch} {f['id']}_{f['nome']}" + "." * max(1, 30 - len(f['nome'])) + f" {fmt_peso(f['peso'])}")
    lines.append("│")

    lines.append("├── 01_PORTAS_E_ENTREGAS.txt")
    lines.append("│   │")
    portas = estrutura.get("portas", [])
    for pi, p in enumerate(portas):
        lines.append(f"│   ├── {p['id']}/")
        for item in p.get("itens", []):
            lines.append(f"│   │   ├── {item}")
        libera = p.get("libera")
        if libera:
            lines.append(f"│   │   └── LIBERA -> {libera}")
        lines.append("│   │")
    lines.append("│")

    lines.append("└── 02_CRONOGRAMA/")
    calendario = estrutura.get("calendario", [])

    # agrupa por (ano, mes) -> semana ISO -> lista de dias
    by_month = OrderedDict()
    for dia in calendario:
        d = datetime.strptime(dia["data"], "%Y-%m-%d")
        month_key = (d.year, d.month)
        by_month.setdefault(month_key, []).append((d, dia))

    for (year, month), dias in by_month.items():
        lines.append(f"    │")
        lines.append(f"    └── {year}-{month:02d}_{MESES_PT[month]}/")
        by_week = OrderedDict()
        for d, dia in dias:
            wk = week_bucket(d, dias)
            by_week.setdefault(wk, []).append((d, dia))

        week_items = list(by_week.items())
        for wi, (wk, week_dias) in enumerate(week_items):
            first_day = week_dias[0][0].day
            last_day = week_dias[-1][0].day
            lines.append(f"        │")
            lines.append(f"        ├── SEMANA_{wi+1:02d}_{first_day:02d}-A-{last_day:02d}/")
            for d, dia in week_dias:
                nome_dia = DIAS_SEMANA_PT[d.weekday()]
                objetos = dia.get("objetos", 0)
                peso_dia = dia.get("peso_dia", 0)
                if objetos == 0:
                    lines.append(f"        │   │")
                    lines.append(f"        │   ├── {d.day:02d}_{nome_dia}/")
                    lines.append(f"        │   │   └── LIVRE — sem execução planejada")
                    continue
                lines.append(f"        │   │")
                lines.append(
                    f"        │   ├── {d.day:02d}_{nome_dia}_[{objetos}_objetos]_[{fmt_peso(peso_dia)}]/"
                )
                for ciclo_nome in ("M0", "M1", "M2", "M3", "M4", "18H"):
                    ciclo = dia.get("ciclos", {}).get(ciclo_nome, {})
                    tarefas = ciclo.get("tarefas", [])
                    lines.append(f"        │   │   ├── {ciclo_nome}/")
                    for t in tarefas:
                        symbol = STATUS_SYMBOL.get(t.get("status", "aberta"), "○")
                        lines.append(
                            f"        │   │   │   ├── {symbol} {t['id']} [{fmt_peso(t['peso'])}] {t['titulo']}"
                        )
                        deps = t.get("depende_de") or []
                        dep_str = " + ".join(deps) if deps else "—"
                        lines.append(f"        │   │   │   │       <= {dep_str}")
                        if t.get("porta"):
                            lines.append(f"        │   │   │   │       => {t['porta']}")
                        if t.get("evidencia"):
                            lines.append(f"        │   │   │   │       evidencia: {t['evidencia']}")
    return lines


def main():
    if len(sys.argv) != 3:
        print("uso: python3 render_tree_txt.py <estrutura.json> <saida.txt>")
        sys.exit(2)
    with open(sys.argv[1], "r", encoding="utf-8") as f:
        estrutura = json.load(f)
    lines = build_tree_lines(estrutura)
    with open(sys.argv[2], "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")
    print(f"árvore gerada: {sys.argv[2]} ({len(lines)} linhas)")


if __name__ == "__main__":
    main()
