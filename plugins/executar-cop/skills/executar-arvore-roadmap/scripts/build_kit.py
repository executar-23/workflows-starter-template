#!/usr/bin/env python3
"""
Orquestrador do modo ARVOREKIT: roda a validação e os quatro renderizadores
(árvore txt, árvore zip, vault Obsidian, csv) e empacota tudo num único zip
final.

Uso:
    python3 build_kit.py <estrutura.json> <pasta_trabalho> <slug_projeto>

Gera dentro de <pasta_trabalho>:
    <slug>_ARVORE.txt
    <slug>_ARVORE-ZIP.zip
    <slug>_OBSIDIAN.zip
    <slug>_DADOS.csv
    <slug>_ARVOREKIT.zip   <- contém os quatro anteriores + relatorio_validacao.txt
"""
import os
import subprocess
import sys
import zipfile

HERE = os.path.dirname(os.path.abspath(__file__))


def run(cmd):
    print(f"$ {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=True, text=True)
    print(result.stdout)
    if result.returncode != 0:
        print(result.stderr, file=sys.stderr)
    return result.returncode


def main():
    if len(sys.argv) != 4:
        print("uso: python3 build_kit.py <estrutura.json> <pasta_trabalho> <slug_projeto>")
        sys.exit(2)

    estrutura_path, work_dir, slug = sys.argv[1], sys.argv[2], sys.argv[3]
    os.makedirs(work_dir, exist_ok=True)

    report_path = os.path.join(work_dir, "relatorio_validacao.txt")
    validate_rc = subprocess.run(
        [sys.executable, os.path.join(HERE, "validate_structure.py"), estrutura_path],
        capture_output=True, text=True,
    )
    with open(report_path, "w", encoding="utf-8") as f:
        f.write(validate_rc.stdout)
    print(validate_rc.stdout)
    if validate_rc.returncode != 0:
        print("VALIDAÇÃO FALHOU — corrija os erros acima em estrutura.json antes de gerar o kit.")
        sys.exit(1)

    tree_txt = os.path.join(work_dir, f"{slug}_ARVORE.txt")
    tree_zip_dir = os.path.join(work_dir, "arvore_fisica")
    tree_zip = os.path.join(work_dir, f"{slug}_ARVORE-ZIP.zip")
    vault_dir = os.path.join(work_dir, "vault")
    vault_zip = os.path.join(work_dir, f"{slug}_OBSIDIAN.zip")
    csv_out = os.path.join(work_dir, f"{slug}_DADOS.csv")

    run([sys.executable, os.path.join(HERE, "render_tree_txt.py"), estrutura_path, tree_txt])
    run([sys.executable, os.path.join(HERE, "render_tree_zip.py"), estrutura_path, tree_zip_dir, tree_zip])
    run([sys.executable, os.path.join(HERE, "render_obsidian_vault.py"), estrutura_path, vault_dir, vault_zip])
    run([sys.executable, os.path.join(HERE, "render_csv.py"), estrutura_path, csv_out])

    kit_zip = os.path.join(work_dir, f"{slug}_ARVOREKIT.zip")
    if os.path.exists(kit_zip):
        os.remove(kit_zip)
    with zipfile.ZipFile(kit_zip, "w", zipfile.ZIP_DEFLATED) as zf:
        for path, arcname in [
            (tree_txt, os.path.basename(tree_txt)),
            (tree_zip, os.path.basename(tree_zip)),
            (vault_zip, os.path.basename(vault_zip)),
            (csv_out, os.path.basename(csv_out)),
            (report_path, os.path.basename(report_path)),
        ]:
            zf.write(path, arcname)

    print(f"\nARVOREKIT completo: {kit_zip}")


if __name__ == "__main__":
    main()
