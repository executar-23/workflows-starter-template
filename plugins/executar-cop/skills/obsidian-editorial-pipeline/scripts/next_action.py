#!/usr/bin/env python3
import argparse,json
from common import load_json,arquivo_estado
from state_engine import eligible_steps
ap=argparse.ArgumentParser(); ap.add_argument('job'); a=ap.parse_args(); st=load_json(arquivo_estado(a.job)); e=eligible_steps(st); print(json.dumps(e[0] if e else {'status':'SEM_ETAPA_ELEGIVEL'},ensure_ascii=False,indent=2))
