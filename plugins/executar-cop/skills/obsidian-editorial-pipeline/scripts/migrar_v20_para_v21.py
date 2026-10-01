#!/usr/bin/env python3
from pathlib import Path
import argparse,shutil
from common import load_json,save_json,process_spec,PASTA_SISTEMA,ARQUIVO_CICLO,ARQUIVO_ESTADO
from navegacao import render_all
OLD_SYS='00-control'
DIRS={'01-brief':'01-Briefing','02-research':'02-Pesquisa','03-mother':'03-Peca-Mae','04-derivatives':'04-Derivados','05-handoff':'05-Entrega-Fase-2','06-quality':'06-Qualidade'}
def main():
    ap=argparse.ArgumentParser(); ap.add_argument('job'); a=ap.parse_args(); root=Path(a.job)
    old_state=root/OLD_SYS/'job-state.json'; old_job=root/OLD_SYS/'job.json'
    if not old_state.exists(): raise SystemExit('job v2.0 não encontrado')
    st=load_json(old_state); job=load_json(old_job); proc=process_spec(); new_by={s['id']:s for s in proc['steps']}; old_out={s['id']:s.get('output') for s in st['steps']}
    for d in [PASTA_SISTEMA,*DIRS.values()]: (root/d).mkdir(parents=True,exist_ok=True)
    for s in st['steps']:
        old_rel=old_out.get(s['id']); new_rel=new_by[s['id']]['output']
        if old_rel:
            src=root/old_rel; dst=root/new_rel; dst.parent.mkdir(parents=True,exist_ok=True)
            if src.exists() and src.resolve()!=dst.resolve(): shutil.move(str(src),str(dst))
        s.update({k:new_by[s['id']][k] for k in ('title','output','depends_on','asset_key')})
        s['outputs']=[new_rel if x==old_rel else x for x in s.get('outputs',[])]
    for old,new in DIRS.items():
        od=root/old; nd=root/new
        if od.exists():
            for p in list(od.rglob('*')):
                if p.is_file():
                    rel=p.relative_to(od); dest=nd/rel; dest.parent.mkdir(parents=True,exist_ok=True)
                    if not dest.exists(): shutil.move(str(p),str(dest))
            shutil.rmtree(od,ignore_errors=True)
    osys=root/OLD_SYS; nsys=root/PASTA_SISTEMA
    if osys.exists():
        for p in list(osys.iterdir()):
            if p.name in ('job-state.json','job.json','production-manifest.json'): continue
            dest=nsys/p.name
            if not dest.exists(): shutil.move(str(p),str(dest))
    save_json(nsys/ARQUIVO_CICLO,job); save_json(nsys/ARQUIVO_ESTADO,st)
    pm=osys/'production-manifest.json'
    if pm.exists(): shutil.move(str(pm),str(nsys/'manifesto-v20-anterior.json'))
    shutil.rmtree(osys,ignore_errors=True)
    render_all(root); print('Migração v2.0 → v2.1 concluída')
if __name__=='__main__': main()
