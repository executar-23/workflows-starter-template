#!/usr/bin/env python3
"""
Valida um estrutura.json contra o schema canônico (ver references/schema.md).

Uso:
    python3 validate_structure.py <estrutura.json>

Sai com código 0 se não houver erros bloqueantes (avisos não bloqueiam).
Sai com código 1 se houver erros bloqueantes (JSON inválido, schema quebrado).
Imprime um relatório de validação legível, no mesmo espírito do relatório
"Validação da geração" do formato de referência (objetos, tarefas, dias,
links quebrados, pesos, etc.).
"""
import json
import sys


def load(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def iter_tasks(estrutura):
    for dia in estrutura.get("calendario", []):
        for ciclo_nome, ciclo in dia.get("ciclos", {}).items():
            for tarefa in ciclo.get("tarefas", []):
                yield dia, ciclo_nome, tarefa


def validate(estrutura):
    errors = []
    warnings = []

    meta = estrutura.get("meta")
    if not meta:
        errors.append("meta ausente")
        return errors, warnings, {}

    portas = {p["id"]: p for p in estrutura.get("portas", [])}
    fluxos = estrutura.get("fluxos_de_valor", [])

    all_ids = set()
    tasks = list(iter_tasks(estrutura))
    dup_ids = set()
    for _, _, t in tasks:
        tid = t.get("id")
        if not tid:
            errors.append("tarefa sem id encontrada")
            continue
        if tid in all_ids:
            dup_ids.add(tid)
        all_ids.add(tid)

    for tid in dup_ids:
        errors.append(f"id de tarefa duplicado: {tid}")

    broken_deps = []
    broken_portas = []
    peso_total = 0.0
    status_count = {"aberta": 0, "concluida": 0, "bloqueada": 0, "marco": 0}
    ciclos_vazios_total = 0
    ciclos_usados_total = 0

    for dia, ciclo_nome, t in tasks:
        for dep in t.get("depende_de", []) or []:
            if dep not in all_ids:
                broken_deps.append((t.get("id"), dep))
        porta = t.get("porta")
        if porta and porta not in portas:
            broken_portas.append((t.get("id"), porta))
        peso_total += float(t.get("peso", 0) or 0)
        status = t.get("status", "aberta")
        if status not in status_count:
            warnings.append(f"status desconhecido '{status}' na tarefa {t.get('id')}")
        else:
            status_count[status] += 1

    for dia in estrutura.get("calendario", []):
        for ciclo_nome in ("M0", "M1", "M2", "M3", "M4", "18H"):
            if ciclo_nome not in dia.get("ciclos", {}):
                warnings.append(f"dia {dia.get('data')} não tem a chave de ciclo {ciclo_nome}")
                continue
            if dia["ciclos"][ciclo_nome].get("tarefas"):
                ciclos_usados_total += 1
            else:
                ciclos_vazios_total += 1

    for pid, p in portas.items():
        if "libera" in p and p["libera"] and p["libera"] not in portas and p["libera"] != "POS_LANCAMENTO":
            warnings.append(f"porta {pid} libera '{p['libera']}', que não existe em portas[]")

    total_peso_meta = float(meta.get("total_peso", 0) or 0)
    if total_peso_meta and abs(peso_total - total_peso_meta) > max(0.5, total_peso_meta * 0.02):
        warnings.append(
            f"soma dos pesos das tarefas ({peso_total:.3f}) diverge do total declarado "
            f"em meta.total_peso ({total_peso_meta:.3f})"
        )

    for tid, dep in broken_deps:
        errors.append(f"dependência quebrada: {tid} depende de '{dep}', que não existe")
    for tid, porta in broken_portas:
        errors.append(f"porta inexistente: {tid} aponta para '{porta}', que não existe em portas[]")

    stats = {
        "dias": len(estrutura.get("calendario", [])),
        "tarefas": len(tasks),
        "fluxos_de_valor": len(fluxos),
        "portas": len(portas),
        "peso_total_calculado": round(peso_total, 3),
        "peso_total_declarado": total_peso_meta,
        "links_quebrados": len(broken_deps) + len(broken_portas),
        "status_count": status_count,
        "ciclos_usados": ciclos_usados_total,
        "ciclos_vazios": ciclos_vazios_total,
    }
    return errors, warnings, stats


def main():
    if len(sys.argv) != 2:
        print("uso: python3 validate_structure.py <estrutura.json>")
        sys.exit(2)

    try:
        estrutura = load(sys.argv[1])
    except Exception as e:
        print(f"ERRO: não foi possível ler/parsear o JSON: {e}")
        sys.exit(1)

    errors, warnings, stats = validate(estrutura)

    print("=" * 60)
    print("RELATÓRIO DE VALIDAÇÃO — executar-arvore-roadmap")
    print("=" * 60)
    if stats:
        print(f"dias no calendário............ {stats['dias']}")
        print(f"tarefas totais................. {stats['tarefas']}")
        print(f"fluxos de valor................ {stats['fluxos_de_valor']}")
        print(f"portas.......................... {stats['portas']}")
        print(f"peso total (calculado)......... {stats['peso_total_calculado']}")
        print(f"peso total (declarado)......... {stats['peso_total_declarado']}")
        print(f"links quebrados................ {stats['links_quebrados']}")
        print(f"ciclos usados / vazios......... {stats['ciclos_usados']} / {stats['ciclos_vazios']}")
        print(f"status das tarefas............. {stats['status_count']}")
    print("-" * 60)
    if errors:
        print(f"ERROS ({len(errors)}):")
        for e in errors:
            print(f"  ✗ {e}")
    else:
        print("ERROS: nenhum")
    if warnings:
        print(f"AVISOS ({len(warnings)}):")
        for w in warnings:
            print(f"  ! {w}")
    else:
        print("AVISOS: nenhum")
    print("=" * 60)

    sys.exit(1 if errors else 0)


if __name__ == "__main__":
    main()
