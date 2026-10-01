---
name: obsidian-editorial-pipeline
version: 2.2.0
description: "Opera a produção editorial faseada no Obsidian a partir de formulário/briefing editorial, Process Doc e estado existente do job. Use para criar, continuar, revisar, organizar ou empacotar ciclos editoriais; compõe dinamicamente artigo, evidências, vídeo, carrosséis, imagens, stories, newsletters, ebooks, CTAs e handoff sem exigir um perfil único. Acionada também pelo ID verbal CV-EDITORIAL-001 (/editorial) do plugin executar-cop."
---
# Obsidian Editorial Pipeline V2.1

## Integração executar-cop
- **ID verbal:** CV-EDITORIAL-001 (`/editorial`). Nó `EDITORIAL-OBSIDIAN` em `../../references/grafo-dependencias.json`.
- **Pré-voo de dependências:** aplicar `../../references/nucleo-dependencias.md`.
  - No fluxo PEM-PIPELINE-PROPRIETARIO, depende da Árvore Visual (DEP-COP-003, bloqueante). Um ciclo editorial avulso, com formulário próprio, não exige a árvore.
  - O DAG de etapas (`config/process-v02.json`) é o grafo de dependências interno do job. Etapa elegível, WIP=1 e bloqueios seguem o núcleo.
- **Busca web:** obrigatória nas etapas de evidências, claims, fontes e dados de mercado. Cite a fonte, marque a data de acesso e nunca invente evidência.
- **Token visual obrigatório:** `../../assets/design-tokens/calendario-light-mode.md`. O `assets/obsidian-editorial.css` e o `references/visual-system-v1.md` já foram migrados para o token. O vermelho fica só para o atual, a prioridade e o hoje.
- **Saída:** job, vault e ZIP de handoff. É o último nó da cadeia proprietária.
- Toda resposta sai em português do Brasil.

## Objetivo
Transformar um formulário editorial em um job operacional rastreável no Obsidian, avançar o job por dependências com WIP=1, validar evidências/gates e gerar o ZIP de produção/handoff quando o pacote atingir 99% PRODUCED.

## Fontes de verdade
1. Pedido e dados explícitos do usuário.
2. Process Doc fornecido na tarefa; na ausência, usar `config/process-v02.json` (snapshot de `PD-CLB-20260922-F01-DOC-V02`).
3. Formulário/workbook fornecido; na ausência, usar `schemas/editorial-form.schema.json` e `references/form-mapping.md`.
4. Estado existente do ciclo em `00-Sistema/estado-do-ciclo.json`.
5. Templates e referências desta skill.

Se houver conflito, aplicar `references/source-precedence.md`. Nunca inventar owner, aprovação, evidência, fonte, data, URL ou status.

## Inferir operação
- `CREATE`: há formulário/briefing e não há job existente.
- `CONTINUE`: há job existente ou pedido para prosseguir/atualizar.
- `PACKAGE`: pedido de ZIP/handoff ou todas as etapas habilitadas 01–21 estão concluídas.
Não exigir comandos rígidos. Aceitar instruções naturais e combinações de entregáveis.

## Experiência obrigatória no Obsidian
- Tudo que o operador vê e preenche deve estar em português.
- Todo ciclo possui um único entry point: `00 - COMEÇAR AQUI.md`.
- O operador atravessa o ciclo por wikilinks internos sem voltar à árvore.
- Toda etapa mostra **Anterior · Começar aqui · Painel · Próxima**.
- Imagens aceitam `![[arquivo.png]]` e link do Drive; vídeos possuem campo explícito para URL do Google Drive.
- `99 - FINALIZAR E GERAR ZIP.md` é o ponto final operacional.
- Antes de empacotar um vault preenchido manualmente, executar `scripts/sincronizar_obsidian.py`.
- Consulte `references/navegacao-obsidian.md`.

## Executar
1. Ler integralmente formulário, Process Doc e job existente quando disponíveis.
2. Normalizar a entrada segundo `schemas/editorial-form.schema.json`; preservar campos adicionais em `extensions`.
3. Construir o plano de assets. Defaults vêm do Process Doc; valores explícitos do formulário substituem defaults.
4. Criar/atualizar a camada técnica em `00-Sistema/` e sempre gerar `00 - COMEÇAR AQUI.md`, `01 - PAINEL DO CICLO.md`, a trilha anterior/próxima, `98 - CHECKLIST FINAL.md` e `99 - FINALIZAR E GERAR ZIP.md`.
5. Gerar o DAG a partir de `config/process-v02.json`. Desabilitar apenas etapas derivadas cujo asset tenha quantidade explícita zero/exclusão registrada.
6. Selecionar somente um nó elegível por vez. Não iniciar próximo nó enquanto existir `IN_PROGRESS`.
7. Produzir o artefato do nó com o template correspondente; adaptar estrutura ao conteúdo real sem criar seções vazias.
8. Registrar output e evidência. `DONE` exige output existente + critério objetivo + evidência quando exigida.
9. Recalcular estado: 0% PLANNED → 33% STRUCTURED → 66% IMPLEMENTED → 99% PRODUCED → 100% VERIFIED.
10. Antes de ZIP, executar `scripts/validate_job.py`. Corrigir erros.
11. Em 99% PRODUCED, executar `scripts/build_production_zip.py`. O ZIP é handoff da Fase 1; não equivale a publicação.
12. Só marcar 100% VERIFIED quando houver evidência explícita de aceite do handoff/Fase 2.

## Modelo editorial canônico
Usar `PROBLEM → SOLUTION → ASSET`. Evidência e raciocínio ficam ligados ao PROBLEM; derivados herdam e adaptam. Sequência editorial padrão: CENA → PROBLEMA → RECONHECIMENTO → EXPLICAÇÃO → SOLUÇÃO → DEMONSTRAÇÃO → FERRAMENTA → RESULTADO → CTA. Um asset deve ter uma próxima ação principal.

## Regras de controle
- WIP=1.
- Não publicar, agendar, enviar ou contatar terceiros sem autorização explícita.
- Não refazer pesquisa já sustentada apenas porque muda o formato do asset.
- Não tratar arquivo existente como prova de conclusão.
- Não marcar claim como sustentado sem fonte identificável.
- Capturar nova ideia durante WIP na fila/backlog; não interromper o nó ativo.
- Quando faltar aprovação humana, preparar tudo e usar `USER_ACTION_REQUIRED`.
- Em falha parcial, registrar efeitos já produzidos e evitar duplicidade.

## Ferramentas locais
```bash
python3 scripts/normalize_form.py FORMULARIO --out normalized-form.json
python3 scripts/create_job.py normalized-form.json --out JOB_DIR
python3 scripts/next_action.py JOB_DIR
python3 scripts/update_step.py JOB_DIR S01 --start
python3 scripts/update_step.py JOB_DIR S01 --done --output CAMINHO --evidence "descrição/arquivo"
python3 scripts/sincronizar_obsidian.py JOB_DIR
python3 scripts/atualizar_navegacao.py JOB_DIR
python3 scripts/validate_job.py JOB_DIR
python3 scripts/build_production_zip.py JOB_DIR --out pacote.zip
python3 scripts/verify_package.py pacote.zip
```

## Entrega ao usuário
Informar status, nó executado, artefatos criados/alterados, evidência, bloqueios e próxima ação. Em PACKAGE, entregar o ZIP e o relatório de verificação. Não alegar 100% VERIFIED sem aceite registrado.


## Experiência do usuário V2.2
A camada humana segue `references/ux-hig-obsidian.md`. Gere um entry point simples, a pasta `02 - TRILHA` em ordem sequencial e páginas com **Agora → Entregue isto → Preencha aqui → Evidência → Pronto quando → Próximo passo**. Use português nos rótulos humanos e mantenha IDs técnicos em propriedades/metadados. O fluxo principal não depende de plugins comunitários.
