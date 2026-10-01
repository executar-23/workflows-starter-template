#!/usr/bin/env python3
"""
Gera um vault Obsidian completo ("deep file") a partir de estrutura.json,
seguindo o padrão de mergulho progressivo:
Dia -> Ciclo -> Tarefa -> Evidência -> Porta -> Próximo mergulho -> Fechamento -> Drive.

Cada nota de tarefa segue a sequência: POSIÇÃO / RESULTADO NECESSÁRIO / ENTREGA /
POR QUE VEM AGORA / ABRA-FAÇA-CONFIRME / ACABA QUANDO / EVIDÊNCIA / REGISTRO /
PORTA DE PASSAGEM / PRÓXIMO MERGULHO — com Properties (YAML frontmatter) ocultáveis
no topo para o Obsidian e para o controlador, sem poluir a leitura humana.

Uso:
    python3 render_obsidian_vault.py <estrutura.json> <pasta_vault> <arquivo.zip>
"""
import json
import os
import sys
import shutil
import zipfile
from collections import OrderedDict
from datetime import datetime

MESES_PT = [
    "", "JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO", "JULHO",
    "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO",
]
DIAS_SEMANA_PT = ["SEGUNDA", "TERCA", "QUARTA", "QUINTA", "SEXTA", "SABADO", "DOMINGO"]


def write(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)


def frontmatter(props):
    lines = ["---"]
    for k, v in props.items():
        if isinstance(v, list):
            lines.append(f"{k}:")
            for item in v:
                lines.append(f"  - {item}")
        else:
            lines.append(f"{k}: {v}")
    lines.append("---\n")
    return "\n".join(lines)


def task_note(t, dia, ciclo_nome, next_id, vault_day_path):
    deps = t.get("depende_de") or []
    props = frontmatter({
        "id": t["id"],
        "tipo": "tarefa",
        "data": dia["data"],
        "ciclo": ciclo_nome,
        "peso": t["peso"],
        "status": t.get("status", "aberta"),
        "depende_de": deps if deps else "[]",
        "porta": t.get("porta") or "null",
    })
    body = f"""{props}
# {t['id']} — {t['titulo']}

**POSIÇÃO**
{dia['data']} · ciclo {ciclo_nome} · peso {t['peso']}

**RESULTADO NECESSÁRIO**
{t['titulo']}

**ENTREGA**
{t.get('evidencia') or '(defina a evidência concreta que prova a conclusão desta tarefa)'}

**POR QUE VEM AGORA**
{"depende de: " + " + ".join(deps) if deps else "sem dependências — pode iniciar imediatamente"}

**① ABRA** — abra o estado atual do ciclo {ciclo_nome} e confirme a posição no dia.
**② FAÇA** — execute o trabalho descrito em "RESULTADO NECESSÁRIO".
**③ CONFIRME** — registre a evidência em "ENTREGA" antes de fechar a nota.

**ACABA QUANDO**
A evidência estiver registrada e o status desta nota mudar para concluída.

**EVIDÊNCIA**
{t.get('evidencia') or '(pendente de registro)'}

**REGISTRO**
status: {t.get('status', 'aberta')}

**PORTA DE PASSAGEM**
{("=> " + t['porta']) if t.get('porta') else "— (não contribui diretamente para uma porta)"}

**PRÓXIMO MERGULHO →**
{f"[[{next_id}]]" if next_id else "[[99_FECHAR-DIA]]"}
"""
    return body


def gate_note(porta_id, porta, day_path=None):
    props = frontmatter({"id": porta_id, "tipo": "porta"})
    itens = "\n".join(f"- [ ] {i}" for i in porta.get("itens", []))
    libera = porta.get("libera", "")
    return f"""{props}
# Porta {porta_id}

## Itens exigidos
{itens}

## Libera
{f"[[{libera}]]" if libera else "(porta final)"}
"""


def close_day_note(dia, next_day_id):
    props = frontmatter({"id": f"FECHAR-{dia['data']}", "tipo": "fechamento"})
    return f"""{props}
# Fechamento do dia {dia['data']}

**PORTA DO DIA**
Revise se as tarefas do dia contribuíram para as portas indicadas em cada nota.

**RESUMO FACTUAL**
objetos: {dia.get('objetos', 0)} · peso do dia: {dia.get('peso_dia', 0)}

**ARQUIVAR O DIA**
1. fechar esta nota
2. pegar a pasta inteira do dia
3. arrastar para o Google Drive
4. deixar apenas a ponte no Vault
5. registrar a localização final

**PRÓXIMO DIA →**
{f"[[{next_day_id}]]" if next_day_id else "(último dia do plano)"}
"""


def home_note(meta):
    props = frontmatter({"id": "00_EXECUTAR", "tipo": "home"})
    return f"""{props}
# {meta.get('titulo', 'Projeto')}

{meta.get('objetivo', '')}

início: {meta.get('inicio', '')} · fim: {meta.get('fim', '')} · total: {meta.get('total_peso', 100)}%

[[01_HOJE]]
"""


def hoje_note():
    props = frontmatter({"id": "01_HOJE", "tipo": "ponteiro"})
    return f"""{props}
# Continuar de onde parei

Abra a pasta do dia atual em `01_.../SEMANA-.../<dia>/00_ABRIR-DIA` para retomar o mergulho.
"""


def build(estrutura, vault_dir):
    if os.path.exists(vault_dir):
        shutil.rmtree(vault_dir)
    meta = estrutura["meta"]

    write(os.path.join(vault_dir, "00_INICIO", "00_EXECUTAR.md"), home_note(meta))
    write(os.path.join(vault_dir, "00_INICIO", "01_HOJE.md"), hoje_note())

    for p in estrutura.get("portas", []):
        write(os.path.join(vault_dir, "03_PORTAS", f"{p['id']}.md"), gate_note(p["id"], p))

    calendario = estrutura.get("calendario", [])
    day_ids = [d["data"] for d in calendario]

    by_month = OrderedDict()
    for dia in calendario:
        d = datetime.strptime(dia["data"], "%Y-%m-%d")
        by_month.setdefault((d.year, d.month), []).append((d, dia))

    for (year, month), dias in by_month.items():
        month_dir_name = f"{year}-{month:02d}_{MESES_PT[month]}"
        by_week = OrderedDict()
        for d, dia in dias:
            by_week.setdefault(d.isocalendar()[1], []).append((d, dia))

        for wi, (wk, week_dias) in enumerate(by_week.items()):
            first_day = week_dias[0][0].day
            last_day = week_dias[-1][0].day
            week_dir_name = f"SEMANA-{wi+1:02d}_{first_day:02d}-{last_day:02d}"

            for idx, (d, dia) in enumerate(week_dias):
                nome_dia = DIAS_SEMANA_PT[d.weekday()]
                day_dir = os.path.join(vault_dir, month_dir_name, week_dir_name, f"{d.day:02d}_{nome_dia}")
                cur_index = day_ids.index(dia["data"])
                next_day = calendario[cur_index + 1]["data"] if cur_index + 1 < len(calendario) else None

                write(os.path.join(day_dir, "00_ABRIR-DIA.md"),
                      f"# Abrir dia {dia['data']}\n\nobjetos: {dia.get('objetos', 0)} · peso: {dia.get('peso_dia', 0)}\n")

                ciclo_dirs = {
                    "M0": "01_M0", "M1": "02_M1", "M2": "03_M2",
                    "M3": "04_M3", "M4": "05_M4", "18H": "06_18H",
                }
                # monta lista linear de todas as tarefas do dia para encadear PRÓXIMO MERGULHO
                linear_tasks = []
                for ciclo_nome in ("M0", "M1", "M2", "M3", "M4", "18H"):
                    for t in dia.get("ciclos", {}).get(ciclo_nome, {}).get("tarefas", []):
                        linear_tasks.append((ciclo_nome, t))

                for i, (ciclo_nome, t) in enumerate(linear_tasks):
                    next_id = linear_tasks[i + 1][1]["id"] if i + 1 < len(linear_tasks) else None
                    ciclo_folder = os.path.join(day_dir, ciclo_dirs[ciclo_nome])
                    write(os.path.join(ciclo_folder, f"{t['id']}.md"),
                          task_note(t, dia, ciclo_nome, next_id, day_dir))

                write(os.path.join(day_dir, "90_EVIDENCIAS", "README.md"),
                      "# Evidências do dia\n\nColoque aqui capturas, links e registros das tarefas concluídas.\n")
                write(os.path.join(day_dir, "99_FECHAR-DIA.md"), close_day_note(dia, next_day))

    return vault_dir


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
        print("uso: python3 render_obsidian_vault.py <estrutura.json> <pasta_vault> <arquivo.zip>")
        sys.exit(2)
    with open(sys.argv[1], "r", encoding="utf-8") as f:
        estrutura = json.load(f)
    vault = build(estrutura, sys.argv[2])
    zip_dir(vault, sys.argv[3])
    n_files = sum(len(files) for _, _, files in os.walk(vault))
    print(f"vault Obsidian gerado em: {vault} ({n_files} notas)")
    print(f"zip gerado em: {sys.argv[3]}")


if __name__ == "__main__":
    main()
