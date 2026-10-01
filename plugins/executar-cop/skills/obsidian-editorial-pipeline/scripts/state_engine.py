from pathlib import Path
from common import load_json,save_json

def eligible_steps(state):
    by={s['id']:s for s in state['steps']}
    if any(s['status']=='IN_PROGRESS' for s in state['steps']): return []
    out=[]
    for s in state['steps']:
        if not s.get('enabled') or s['status'] not in ('PENDING','READY'): continue
        if all(by[d]['status'] in ('DONE','SKIPPED') for d in s.get('depends_on',[])): out.append(s)
    return out

def recalc(state):
    by={s['id']:s for s in state['steps']}
    enabled=[s for s in state['steps'] if s.get('enabled')]
    done=lambda sid: by.get(sid,{}).get('status') in ('DONE','SKIPPED')
    if all(s['status'] in ('DONE','SKIPPED') for s in enabled if s['id']!='S22'):
        state['state']='PRODUCED'; state['percent']=99
    elif all(done(x) for x in ['S01','S02','S03','S04']):
        state['state']='STRUCTURED'; state['percent']=33
        if all(done(x) for x in ['S05','S06','S07','S08','S09'] if by.get(x,{}).get('enabled')):
            state['state']='IMPLEMENTED'; state['percent']=66
    else: state['state']='PLANNED'; state['percent']=0
    if state.get('handoff_accepted') and by.get('S22',{}).get('status')=='DONE': state['state']='VERIFIED'; state['percent']=100
    return state
