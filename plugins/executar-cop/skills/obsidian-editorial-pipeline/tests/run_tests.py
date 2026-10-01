#!/usr/bin/env python3
import importlib.util,inspect,sys
from pathlib import Path
p=Path(__file__).with_name('test_pipeline.py'); spec=importlib.util.spec_from_file_location('t',p); m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
failed=[]; total=0
for n,f in inspect.getmembers(m,inspect.isfunction):
    if n.startswith('test_'):
        total+=1
        try: f(); print('PASS',n)
        except Exception as e: failed.append((n,str(e))); print('FAIL',n,e)
print(f'{total-len(failed)}/{total} tests passed')
sys.exit(1 if failed else 0)
