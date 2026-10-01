#!/usr/bin/env python3
from pathlib import Path
import argparse,csv,json
from common import save_json,split_ids

def read_any(path):
    p=Path(path); ext=p.suffix.lower()
    if ext=='.json': return json.loads(p.read_text(encoding='utf-8'))
    if ext in ('.yaml','.yml'):
        try:
            import yaml
        except ImportError: raise SystemExit('PyYAML não disponível; converta YAML para JSON.')
        return yaml.safe_load(p.read_text(encoding='utf-8'))
    if ext=='.csv':
        rows=list(csv.DictReader(p.open(encoding='utf-8-sig')))
        if not rows: raise SystemExit('CSV vazio')
        return rows[0]
    if ext=='.xlsx':
        try: import openpyxl
        except ImportError: raise SystemExit('openpyxl não disponível; exporte a linha para CSV/JSON.')
        wb=openpyxl.load_workbook(p,data_only=True,read_only=True)
        # Prefer sheet whose header contains problem_id.
        for ws in wb.worksheets:
            vals=list(ws.iter_rows(values_only=True))
            for i,row in enumerate(vals[:20]):
                hdr=[str(x).strip() if x is not None else '' for x in row]
                if 'problem_id' in hdr:
                    for data in vals[i+1:]:
                        rec={hdr[k]:data[k] for k in range(min(len(hdr),len(data))) if hdr[k]}
                        if rec.get('problem_id'): return rec
        raise SystemExit('Nenhuma linha com problem_id encontrada no XLSX')
    raise SystemExit(f'Formato não suportado: {ext}')

def normalize(d):
    if 'problem' in d: return d
    known_problem=['problem_id','problem_title','problem_statement','audience','context','consequence','principle_mechanism','risk_ids','cognitive_cost_ids','evidence_ids','management_domain_ids','editorial_pillar','awareness_level','priority','status']
    problem={k:d.get(k) for k in known_problem if d.get(k) not in (None,'')}
    for k in ['risk_ids','cognitive_cost_ids','evidence_ids','management_domain_ids']:
        if k in problem: problem[k]=split_ids(problem[k])
    solution={k:d.get(k) for k in ['solution_id','solution_name','family','intervention','before_state','after_state','next_action','success_metric'] if d.get(k) not in (None,'')}
    out={'cycle_id':d.get('cycle_id'),'cycle_title':d.get('cycle_title'),'problem':problem,'solution':solution or None,'topic_pack':d.get('topic_pack') if isinstance(d.get('topic_pack'),dict) else None,'asset_plan':d.get('asset_plan') if isinstance(d.get('asset_plan'),dict) else None}
    used=set(known_problem+list(solution)+['cycle_id','cycle_title','topic_pack','asset_plan'])
    out['extensions']={k:v for k,v in d.items() if k not in used and v not in (None,'')}
    return out

def main():
    ap=argparse.ArgumentParser(); ap.add_argument('form'); ap.add_argument('--out',required=True); a=ap.parse_args()
    out=normalize(read_any(a.form))
    if not out.get('problem',{}).get('problem_id') or not out.get('problem',{}).get('problem_title'): raise SystemExit('Faltam problem_id e/ou problem_title')
    save_json(a.out,out); print(a.out)
if __name__=='__main__': main()
