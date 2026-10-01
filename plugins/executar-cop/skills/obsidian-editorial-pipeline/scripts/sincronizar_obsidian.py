#!/usr/bin/env python3
from pathlib import Path
import argparse,re
from common import load_json,save_json,arquivo_estado
from state_engine import recalc
from navegacao import render_all

def evidence(text):
    m=re.search(r'<!-- EVIDENCIA:INICIO -->(.*?)<!-- EVIDENCIA:FIM -->',text,re.S)
    if not m: return []
    vals=[]
    for ln in m.group(1).splitlines():
        v=ln.strip().lstrip('-').strip()
        if not v or '[PREENCHER' in v or 'COLE_AQUI' in v: continue
        vals.append(v)
    return vals

def complete(text):
    return '- [x] Entregável concluído' in text or '- [X] Entregável concluído' in text

def main():
    ap=argparse.ArgumentParser(); ap.add_argument('job'); a=ap.parse_args(); root=Path(a.job)
    p=arquivo_estado(root); st=load_json(p); by={s['id']:s for s in st['steps']}; changed=[]; warnings=[]
    progress=True
    while progress:
        progress=False
        for s in st['steps']:
            if not s.get('enabled') or s['status'] in ('DONE','SKIPPED'): continue
            f=root/s['output']
            if not f.exists(): continue
            t=f.read_text(encoding='utf-8')
            if not complete(t): continue
            if not all(by[d]['status'] in ('DONE','SKIPPED') for d in s.get('depends_on',[])):
                warnings.append(f"{s['id']}: marcada como concluída, mas dependências ainda não foram concluídas")
                continue
            ev=evidence(t)
            if not ev:
                warnings.append(f"{s['id']}: marcada como concluída, mas sem evidência preenchida")
                continue
            s['status']='DONE'; s['outputs']=[s['output']]; s['evidence']=ev; changed.append(s['id']); progress=True
    recalc(st); save_json(p,st); render_all(root)
    print(f"Sincronizado: {', '.join(changed) if changed else 'nenhuma nova etapa'} | {st['percent']}% {st['state']}")
    for w in dict.fromkeys(warnings): print('AVISO',w)
if __name__=='__main__': main()
