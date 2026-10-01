#!/usr/bin/env python3
import argparse,zipfile,json,hashlib
ap=argparse.ArgumentParser(); ap.add_argument('zip'); a=ap.parse_args(); errs=[]
with zipfile.ZipFile(a.zip) as z:
    names=z.namelist(); mf='00-Sistema/manifesto-de-producao.json'
    if mf not in names: raise SystemExit('manifesto ausente')
    m=json.loads(z.read(mf))
    for f in m['files']:
        if f['path']==mf: continue
        if f['path'] not in names: errs.append('ausente '+f['path']); continue
        h=hashlib.sha256(z.read(f['path'])).hexdigest()
        if h!=f['sha256']: errs.append('hash divergente '+f['path'])
print(json.dumps({'valid':not errs,'files':len(names),'errors':errs},ensure_ascii=False,indent=2)); raise SystemExit(1 if errs else 0)
