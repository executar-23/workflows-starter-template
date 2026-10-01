#!/usr/bin/env python3
from pathlib import Path
import argparse
from common import load_json,save_json,process_spec,PASTA_SISTEMA,ARQUIVO_CICLO,ARQUIVO_ESTADO
from navegacao import render_all

def main():
    ap=argparse.ArgumentParser(); ap.add_argument('form'); ap.add_argument('--out',required=True); a=ap.parse_args()
    form=load_json(a.form); proc=process_spec(); out=Path(a.out); out.mkdir(parents=True,exist_ok=True)
    pid=form['problem']['problem_id']; job_id=form.get('cycle_id') or f"JOB-{pid}"
    plan=dict(proc['default_assets']); plan.update(form.get('asset_plan') or {})
    steps=[]
    for s in proc['steps']:
        enabled=not (s.get('asset_key') and int(plan.get(s['asset_key'],0))==0)
        steps.append({**s,'enabled':enabled,'status':'PENDING' if enabled else 'SKIPPED','outputs':[],'evidence':[]})
    state={'job_id':job_id,'state':'PLANNED','percent':0,'wip_limit':1,'handoff_accepted':False,'handoff_evidence':[],'steps':steps}
    job={'job_id':job_id,'process_id':proc['id'],'form':form,'asset_plan':plan}
    for d in [PASTA_SISTEMA,'02 - TRILHA','03 - ARQUIVOS','04 - FONTES']:(out/d).mkdir(exist_ok=True)
    save_json(out/PASTA_SISTEMA/ARQUIVO_CICLO,job); save_json(out/PASTA_SISTEMA/ARQUIVO_ESTADO,state)
    skill=Path(__file__).resolve().parents[1]
    for s in steps:
        if not s['enabled']: continue
        dest=out/s['output']; dest.parent.mkdir(parents=True,exist_ok=True)
        dest.write_text((skill/'assets/templates/steps'/f"{s['id']}.md").read_text(encoding='utf-8'),encoding='utf-8')
    render_all(out); print(out)
if __name__=='__main__': main()
