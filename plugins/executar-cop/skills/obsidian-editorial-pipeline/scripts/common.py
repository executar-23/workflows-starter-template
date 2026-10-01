from pathlib import Path
import json, hashlib
ROOT=Path(__file__).resolve().parents[1]
PASTA_SISTEMA="00-Sistema"
ARQUIVO_CICLO="ciclo.json"
ARQUIVO_ESTADO="estado-do-ciclo.json"
ARQUIVO_MANIFESTO="manifesto-de-producao.json"
def load_json(p): return json.loads(Path(p).read_text(encoding='utf-8'))
def save_json(p,obj):
    p=Path(p); p.parent.mkdir(parents=True,exist_ok=True); p.write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def process_spec(): return load_json(ROOT/'config/process-v02.json')
def pasta_sistema(root): return Path(root)/PASTA_SISTEMA
def arquivo_estado(root): return pasta_sistema(root)/ARQUIVO_ESTADO
def arquivo_ciclo(root): return pasta_sistema(root)/ARQUIVO_CICLO
def arquivo_manifesto(root): return pasta_sistema(root)/ARQUIVO_MANIFESTO
def sha256(p):
    h=hashlib.sha256()
    with open(p,'rb') as f:
        for b in iter(lambda:f.read(1024*1024),b''): h.update(b)
    return h.hexdigest()
def split_ids(v):
    if v is None: return []
    if isinstance(v,list): return v
    return [x.strip() for x in str(v).replace(',', ';').split(';') if x.strip()]
