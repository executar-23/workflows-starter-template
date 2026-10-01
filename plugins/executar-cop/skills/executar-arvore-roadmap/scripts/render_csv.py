#!/usr/bin/env python3
"""
Converte estrutura.json em um CSV estruturado — uma linha por tarefa, com
todas as colunas necessárias para reconstruir o plano fora deste formato
(planilha, BI, import para outra ferramenta, etc).

Uso:
    python3 render_csv.py <estrutura.json> <saida.csv>
"""
import csv
import json
import sys

COLUMNS = [
    "task_id", "data", "ciclo", "titulo", "peso", "status",
    "depende_de", "porta", "evidencia", "fluxo_de_valor_provavel",
]


def guess_fluxo(task_id, fluxos):
    # heurística simples: usa o prefixo do id da tarefa se bater com algum fluxo conhecido
    return ""


def main():
    if len(sys.argv) != 3:
        print("uso: python3 render_csv.py <estrutura.json> <saida.csv>")
        sys.exit(2)
    with open(sys.argv[1], "r", encoding="utf-8") as f:
        estrutura = json.load(f)

    rows = []
    for dia in estrutura.get("calendario", []):
        for ciclo_nome, ciclo in dia.get("ciclos", {}).items():
            for t in ciclo.get("tarefas", []):
                rows.append({
                    "task_id": t.get("id", ""),
                    "data": dia.get("data", ""),
                    "ciclo": ciclo_nome,
                    "titulo": t.get("titulo", ""),
                    "peso": t.get("peso", ""),
                    "status": t.get("status", "aberta"),
                    "depende_de": " + ".join(t.get("depende_de") or []),
                    "porta": t.get("porta") or "",
                    "evidencia": t.get("evidencia") or "",
                    "fluxo_de_valor_provavel": "",
                })

    with open(sys.argv[2], "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=COLUMNS)
        writer.writeheader()
        writer.writerows(rows)

    print(f"csv gerado: {sys.argv[2]} ({len(rows)} linhas)")


if __name__ == "__main__":
    main()
