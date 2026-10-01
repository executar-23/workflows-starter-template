from pathlib import Path
from common import load_json, arquivo_estado, arquivo_ciclo

STATUS_PT={"PENDING":"Pendente","READY":"Pronta","IN_PROGRESS":"Em andamento","DONE":"Concluída","SKIPPED":"Não aplicável","BLOCKED":"Bloqueada"}
ICON={"PENDING":"○","READY":"●","IN_PROGRESS":"▶","DONE":"✓","SKIPPED":"–","BLOCKED":"!"}
STATE_PT={"PLANNED":"PLANEJADO","STRUCTURED":"ESTRUTURADO","IMPLEMENTED":"IMPLEMENTADO","PRODUCED":"PRODUZIDO","VERIFIED":"VERIFICADO"}

def wikilink(path,label=None):
    p=str(Path(path).with_suffix('')).replace('\\','/')
    return f"[[{p}|{label or Path(p).name}]]"

def replace_block(text,marker,content):
    a=f"<!-- {marker}:INICIO -->"; b=f"<!-- {marker}:FIM -->"
    if a in text and b in text:
        pre,rest=text.split(a,1); _,post=rest.split(b,1)
        return pre+a+'\n'+content.strip()+'\n'+b+post
    return text

def enabled_steps(st):
    return [s for s in st['steps'] if s.get('enabled')]

def current_step(st):
    es=enabled_steps(st)
    for s in es:
        if s['status']=='IN_PROGRESS':
            return s
    by={x['id']:x for x in es}
    for s in es:
        if s['status'] in ('PENDING','READY','BLOCKED') and all(by.get(d,{'status':'DONE'})['status'] in ('DONE','SKIPPED') for d in s.get('depends_on',[])):
            return s
    return next((s for s in es if s['status'] not in ('DONE','SKIPPED')),None)

def progress_bar(p):
    n=max(0,min(10,round(p/10)))
    return '●'*n+'○'*(10-n)

def nav_line(prev,nxt):
    parts=[]
    if prev:
        parts.append('← '+wikilink(prev['output'],'Anterior'))
    parts += [wikilink('00 - COMEÇAR AQUI.md','Início'),wikilink('01 - PAINEL DO CICLO.md','Painel')]
    if nxt:
        parts.append(wikilink(nxt['output'],'Próxima →'))
    else:
        parts.append(wikilink('99 - FINALIZAR E GERAR ZIP.md','Finalizar →'))
    return ' · '.join(parts)

def render_step_nav(root,st):
    es=enabled_steps(st)
    for i,s in enumerate(es):
        f=root/s['output']
        if not f.exists():
            continue
        prev=es[i-1] if i else None
        nxt=es[i+1] if i+1<len(es) else None
        top='> [!navegacao]\n> '+nav_line(prev,nxt)
        next_target=(wikilink(nxt['output'],f"Abrir {nxt.get('ui_title') or nxt['title']} →") if nxt else wikilink('99 - FINALIZAR E GERAR ZIP.md','Finalizar e gerar ZIP →'))
        bottom='> [!proximo] Próximo passo\n> Quando esta etapa estiver concluída: **'+next_target+'**'
        text=f.read_text(encoding='utf-8')
        if '<!-- NAVEGACAO:INICIO -->' in text:
            text=replace_block(text,'NAVEGACAO',top)
        else:
            block='<!-- NAVEGACAO:INICIO -->\n'+top+'\n<!-- NAVEGACAO:FIM -->\n\n'
            if text.startswith('---') and '\n---' in text[3:]:
                end=text.find('\n---',3)+4
                text=text[:end]+'\n'+block+text[end:].lstrip('\n')
            else:
                text=block+text
        if '<!-- NAVEGACAO-RODAPE:INICIO -->' in text:
            text=replace_block(text,'NAVEGACAO-RODAPE',bottom)
        else:
            text=text.rstrip()+'\n\n'+bottom+'\n'
        if text.startswith('---') and 'editorial-hig' not in text.split('---',2)[1]:
            parts=text.split('---',2)
            fm=parts[1]+'\ncssclasses:\n  - obsidian-editorial\n  - editorial-hig\n'
            text='---'+fm+'---'+parts[2]
        f.write_text(text,encoding='utf-8')

def render_root_pages(root):
    root=Path(root)
    st=load_json(arquivo_estado(root))
    job=load_json(arquivo_ciclo(root))
    form=job.get('form',{})
    title=form.get('cycle_title') or form.get('problem',{}).get('problem_title') or st['job_id']
    es=enabled_steps(st)
    cur=current_step(st)
    cur_link=wikilink(cur['output'],f"ABRIR AGORA · {cur.get('ui_title') or cur['title']} →") if cur else wikilink('99 - FINALIZAR E GERAR ZIP.md','FINALIZAR →')
    idx=es.index(cur) if cur in es else len(es)-1
    upcoming=es[idx:idx+3] if cur else []
    next_rows='\n'.join(f"- {ICON.get(s['status'],'•')} **Etapa {s['id'][1:]}** — {wikilink(s['output'],s.get('ui_title') or s['title'])}" for s in upcoming)
    done=[s for s in es if s['status'] in ('DONE','SKIPPED')]
    done_rows='\n'.join(f"> - {ICON.get(s['status'],'•')} {wikilink(s['output'],s.get('ui_title') or s['title'])}" for s in done) or '> Nenhuma ainda.'
    all_rows='\n'.join(f"> - {ICON.get(s['status'],'•')} **Etapa {s['id'][1:]}** — {wikilink(s['output'],s.get('ui_title') or s['title'])} · {STATUS_PT.get(s['status'],s['status'])}" for s in es)
    start=f'''---
tipo: "Entrada do ciclo"
status: "{STATE_PT.get(st['state'],st['state'])}"
progresso: {st['percent']}
cssclasses:
  - obsidian-editorial
  - editorial-hig
---
# {title}

> [!agora] Agora · {st['percent']}%
> **{progress_bar(st['percent'])}**
>
> Você não precisa escolher o próximo arquivo. Continue daqui:
>
> **{cur_link}**

> [!entrega] Como trabalhar
> 1. Abra a etapa atual.
> 2. Preencha somente o que ela pede.
> 3. Registre arquivo/link e evidência.
> 4. Marque o critério de pronto.
> 5. Use **Próxima →**.

## Próximos passos
{next_rows or '- Nenhum. O ciclo está pronto para finalização.'}

## Atalhos
- {wikilink('01 - PAINEL DO CICLO.md','Ver o painel do ciclo')}
- {wikilink('98 - CHECKLIST FINAL.md','Fazer checklist final')}
- {wikilink('99 - FINALIZAR E GERAR ZIP.md','Finalizar e gerar ZIP')}

> [!contexto]- Etapas já concluídas
{done_rows}

> [!contexto]- Ver a trilha completa
{all_rows}
'''
    (root/'00 - COMEÇAR AQUI.md').write_text(start,encoding='utf-8')
    panel=f'''---
tipo: "Painel do ciclo"
cssclasses:
  - obsidian-editorial
  - editorial-hig
---
# Painel do ciclo

> [!navegacao]
> [[00 - COMEÇAR AQUI|← Início]] · [[99 - FINALIZAR E GERAR ZIP|Finalizar →]]

> [!agora] Etapa atual
> **{st['percent']}% · {STATE_PT.get(st['state'],st['state'])}**
>
> {cur_link}

## Próximas 3
{next_rows or '- Nenhuma pendência antes da finalização.'}

> [!contexto]- Trilha completa
{all_rows}

> [!contexto]- Atalhos por tipo de entrega
> - **Artigo:** {wikilink(next((s['output'] for s in es if s['id']=='S05'),'02 - TRILHA/Etapa 05 - Escrever o artigo.md'),'Abrir artigo')}
> - **Vídeo-mãe:** {wikilink(next((s['output'] for s in es if s['id']=='S08'),'02 - TRILHA/Etapa 08 - Registrar o vídeo-mãe.md'),'Abrir vídeo-mãe')}
> - **Imagens:** {wikilink(next((s['output'] for s in es if s['id']=='S13'),'02 - TRILHA/Etapa 13 - Registrar imagens.md'),'Abrir imagens')}
> - **Carrosséis:** {wikilink(next((s['output'] for s in es if s['id']=='S12'),'02 - TRILHA/Etapa 12 - Produzir carrosséis.md'),'Abrir carrosséis')}
> - **Qualidade:** {wikilink(next((s['output'] for s in es if s['id']=='S21'),'02 - TRILHA/Etapa 21 - Fazer conferência final.md'),'Abrir conferência final')}
'''
    (root/'01 - PAINEL DO CICLO.md').write_text(panel,encoding='utf-8')
    (root/'98 - CHECKLIST FINAL.md').write_text('''---
tipo: "Checklist final"
cssclasses:
  - obsidian-editorial
  - editorial-hig
---
# Checklist final

> [!navegacao]
> [[00 - COMEÇAR AQUI|← Início]] · [[99 - FINALIZAR E GERAR ZIP|Finalizar →]]

> [!agora] Faça uma última passagem
> Marque apenas o que você realmente conferiu.

> [!pronto] Pronto para gerar o ZIP quando
> - [ ] Todas as etapas habilitadas até a 21 estão concluídas ou não aplicáveis.
> - [ ] Arquivos e links do Drive estão registrados.
> - [ ] Evidências estão preenchidas.
> - [ ] Nomes e versões estão corretos.
> - [ ] Índice de arquivos está reconciliado.
> - [ ] CTA e destino foram conferidos.
> - [ ] Acessibilidade e qualidade foram verificadas.

> [!contexto]- Importante
> Gerar o ZIP representa **99% PRODUZIDO**. O ciclo só chega a 100% VERIFICADO depois do aceite real da Fase 2.
''',encoding='utf-8')
    (root/'99 - FINALIZAR E GERAR ZIP.md').write_text('''---
tipo: "Finalização do ciclo"
cssclasses:
  - obsidian-editorial
  - editorial-hig
---
# Finalizar e gerar ZIP

> [!navegacao]
> [[98 - CHECKLIST FINAL|← Checklist final]] · [[00 - COMEÇAR AQUI|Início]]

> [!agora] Última ação da Fase 1
> Confira o checklist e então peça à skill para **sincronizar, validar e gerar o ZIP**.

> [!entrega] Resultado esperado
> Um ZIP de produção com manifesto, hashes e todos os entregáveis da Fase 1.

## Registro do pacote
- **Arquivo ZIP:** [PREENCHER PELA SKILL]
- **SHA-256:** [PREENCHER PELA SKILL]
- **Estado esperado:** 99% PRODUZIDO

> [!contexto]- Depois do ZIP
> O handoff e o aceite real da Fase 2 ficam na **Etapa 22**. Sem essa evidência, não declarar 100% VERIFICADO.
''',encoding='utf-8')
    render_step_nav(root,st)

def render_all(root):
    render_root_pages(Path(root))
