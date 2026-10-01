#!/usr/bin/env python3
import argparse
from common import load_json,save_json,arquivo_estado
from state_engine import eligible_steps,recalc
from navegacao import render_all
ap=argparse.ArgumentParser(); ap.add_argument('job'); ap.add_argument('step'); g=ap.add_mutually_exclusive_group(required=True); g.add_argument('--start',action='store_true'); g.add_argument('--done',action='store_true'); g.add_argument('--block',action='store_true'); ap.add_argument('--output',action='append',default=[]); ap.add_argument('--evidence',action='append',default=[]); a=ap.parse_args()
p=arquivo_estado(a.job); st=load_json(p); by={s['id']:s for s in st['steps']}; s=by.get(a.step)
if not s or not s.get('enabled'): raise SystemExit('Etapa inválida/desabilitada')
if a.start:
    elig={x['id'] for x in eligible_steps(st)}
    if a.step not in elig: raise SystemExit('Etapa não elegível ou WIP ocupado')
    s['status']='IN_PROGRESS'
elif a.done:
    if s['status']!='IN_PROGRESS': raise SystemExit('Somente etapa IN_PROGRESS pode virar DONE')
    s['outputs']+=a.output; s['evidence']+=a.evidence
    if not s['outputs']: raise SystemExit('DONE exige --output')
    if not s['evidence']: raise SystemExit('DONE exige --evidence')
    s['status']='DONE'
else: s['status']='BLOCKED'
recalc(st); save_json(p,st); render_all(a.job); print(f"{a.step}={s['status']} | {st['percent']}% {st['state']}")
