import tempfile,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]; PY=sys.executable

def run(*args,ok=True):
    r=subprocess.run([PY,*map(str,args)],capture_output=True,text=True)
    if ok and r.returncode: raise AssertionError(r.stdout+r.stderr)
    return r

def test_create_entrypoint_navigation_validate():
    with tempfile.TemporaryDirectory() as td:
        td=Path(td); job=td/'job'; run(ROOT/'scripts/create_job.py',ROOT/'examples/editorial-form.example.json','--out',job)
        assert (job/'00 - COMEÇAR AQUI.md').exists()
        assert (job/'01 - PAINEL DO CICLO.md').exists()
        assert (job/'99 - FINALIZAR E GERAR ZIP.md').exists()
        s1=job/'02 - TRILHA/Etapa 01 - Validar o tema.md'
        assert s1.exists(); t=s1.read_text(encoding='utf-8'); assert '[[00 - COMEÇAR AQUI|' in t and 'Próxima' in t
        assert 'Link do Google Drive' in (job/'02 - TRILHA/Etapa 08 - Registrar o vídeo-mãe.md').read_text(encoding='utf-8')
        assert '![[NOME-DA-IMAGEM.png]]' in (ROOT/'assets/templates/steps/S13.md').read_text(encoding='utf-8')
        r=run(ROOT/'scripts/next_action.py',job); assert 'S01' in r.stdout
        r=run(ROOT/'scripts/validate_job.py',job); assert '"valid": true' in r.stdout

def test_wip_and_done_requires_evidence():
    with tempfile.TemporaryDirectory() as td:
        td=Path(td); job=td/'job'; run(ROOT/'scripts/create_job.py',ROOT/'examples/editorial-form.example.json','--out',job)
        run(ROOT/'scripts/update_step.py',job,'S01','--start')
        r=run(ROOT/'scripts/update_step.py',job,'S02','--start',ok=False); assert r.returncode!=0
        out='02 - TRILHA/Etapa 01 - Validar o tema.md'
        r=run(ROOT/'scripts/update_step.py',job,'S01','--done','--output',out,ok=False); assert r.returncode!=0
        run(ROOT/'scripts/update_step.py',job,'S01','--done','--output',out,'--evidence','registro de teste')
        r=run(ROOT/'scripts/next_action.py',job); assert 'S02' in r.stdout

def test_manual_sync():
    with tempfile.TemporaryDirectory() as td:
        td=Path(td); job=td/'job'; run(ROOT/'scripts/create_job.py',ROOT/'examples/editorial-form.example.json','--out',job)
        f=job/'02 - TRILHA/Etapa 01 - Validar o tema.md'; t=f.read_text(encoding='utf-8')
        t=t.replace('- [PREENCHER: arquivo, link do Drive, registro, checklist ou outra evidência verificável]','- tema aprovado em briefing').replace('- [ ] Entregável concluído','- [x] Entregável concluído')
        f.write_text(t,encoding='utf-8')
        r=run(ROOT/'scripts/sincronizar_obsidian.py',job); assert 'S01' in r.stdout

def test_package_blocked_early():
    with tempfile.TemporaryDirectory() as td:
        td=Path(td); job=td/'job'; run(ROOT/'scripts/create_job.py',ROOT/'examples/editorial-form.example.json','--out',job)
        r=run(ROOT/'scripts/build_production_zip.py',job,'--out',td/'x.zip',ok=False); assert r.returncode!=0
