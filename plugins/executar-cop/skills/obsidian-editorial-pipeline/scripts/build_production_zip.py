#!/usr/bin/env python3
from pathlib import Path
import argparse,zipfile
from common import load_json,save_json,sha256,arquivo_estado,arquivo_manifesto
from state_engine import recalc
from navegacao import render_all
ap=argparse.ArgumentParser(); ap.add_argument('job'); ap.add_argument('--out',required=True); a=ap.parse_args(); root=Path(a.job).resolve(); render_all(root); st=load_json(arquivo_estado(root)); recalc(st)
if st['state'] not in ('PRODUCED','VERIFIED') or st['percent']<99: raise SystemExit('Pacote bloqueado: ciclo ainda não atingiu 99% PRODUZIDO')
files=[p for p in root.rglob('*') if p.is_file() and '.obsidian' not in p.parts and p.suffix.lower() not in ('.zip','.skill') and '__pycache__' not in p.parts]
manifest={'job_id':st['job_id'],'state':st['state'],'percent':st['percent'],'files':[{'path':str(p.relative_to(root)),'sha256':sha256(p),'bytes':p.stat().st_size} for p in files]}
save_json(arquivo_manifesto(root),manifest)
files=[p for p in root.rglob('*') if p.is_file() and '.obsidian' not in p.parts and p.suffix.lower() not in ('.zip','.skill') and '__pycache__' not in p.parts]
out=Path(a.out); out.parent.mkdir(parents=True,exist_ok=True)
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as z:
    for p in files: z.write(p,p.relative_to(root))
print(out)
