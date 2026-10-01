#!/usr/bin/env python3
from pathlib import Path
import argparse,json
from common import load_json,arquivo_estado,arquivo_ciclo
from state_engine import recalc
ap=argparse.ArgumentParser(); ap.add_argument('job'); a=ap.parse_args(); root=Path(a.job); errs=[]; warns=[]
for f in [arquivo_ciclo(root),arquivo_estado(root),root/'00 - COMEÇAR AQUI.md',root/'01 - PAINEL DO CICLO.md',root/'99 - FINALIZAR E GERAR ZIP.md']:
    if not Path(f).exists(): errs.append(f'ausente: {Path(f).relative_to(root)}')
if errs: print('\n'.join('ERROR '+x for x in errs)); raise SystemExit(1)
st=load_json(arquivo_estado(root)); recalc(st)
if st.get('wip_limit')!=1: errs.append('wip_limit deve ser 1')
if sum(s['status']=='IN_PROGRESS' for s in st['steps'])>1: errs.append('WIP violado: mais de uma etapa IN_PROGRESS')
by={s['id']:s for s in st['steps']}
for s in st['steps']:
    if not s.get('enabled'): continue
    page=root/s['output']
    if not page.exists(): errs.append(f"{s['id']} página ausente: {s['output']}")
    elif '[[00 - COMEÇAR AQUI|' not in page.read_text(encoding='utf-8'): warns.append(f"{s['id']} sem link de retorno ao entry point")
    if s['status']=='DONE':
        if not s.get('outputs'): errs.append(f"{s['id']} DONE sem output")
        if not s.get('evidence'): errs.append(f"{s['id']} DONE sem evidência")
        for o in s.get('outputs',[]):
            op=Path(o); op=op if op.is_absolute() else root/op
            if not op.exists(): errs.append(f"{s['id']} output inexistente: {o}")
    if s['status'] in ('DONE','IN_PROGRESS'):
        for d in s.get('depends_on',[]):
            if by[d]['status'] not in ('DONE','SKIPPED'): errs.append(f"{s['id']} avançou sem dependência {d}")
if st['state']=='VERIFIED' and (not st.get('handoff_accepted') or by.get('S22',{}).get('status')!='DONE'): errs.append('VERIFIED exige S22 DONE + handoff_accepted')
if st['percent']==100 and not st.get('handoff_evidence'): errs.append('100% exige handoff_evidence')
print(json.dumps({'valid':not errs,'errors':errs,'warnings':warns,'state':st['state'],'percent':st['percent']},ensure_ascii=False,indent=2)); raise SystemExit(1 if errs else 0)
