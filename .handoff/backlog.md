# Backlog

> Origem: /verify Phase 1 (2026-09-30) — Execução real por agentes Claude Code no fluxo EXECUTAR

- [ ] #1 Rework do G05 roda o bloco multi-instância N11→D8 sem `item` e reinicia a iteração do G04 (`workflow.ts:417` → `rework` em `:429-440` → `execGate(node, item)` em `:451` ignora `iteration`): grava em prefixo sem item e, num segundo rework, repete o nome de step do G04 (decisão reaproveitada do cache); hoje é latente porque D8 já é conferido por item antes do G05, mas deve iterar por asset e propagar a iteração para gates aninhados.
- [ ] #2 No timeout de agente (`workflow.ts:239-242`) marcar a tarefa anterior como expirada no TaskBoard e voltar a READY (novo OK) como diz o plano, para não deixar tarefa órfã `despachada` que um agente ainda consegue concluir sem efeito.
- [ ] #8 `completedAt: new Date()` fora de `step.do` (`workflow.ts:256`, `:282`) muda a cada replay: capturar a data dentro do step de conferência.

> Origem: /verify Phase 2 (2026-09-30) — Plano Ops upstream

- [ ] #10 `validatePlanCsv` não confere a ordem exata das colunas 1–22 nem a obrigatoriedade de `prioridade`/`tags` (`shared/plan.ts:47`, `:62`): o `schema-csv-tarefas.md` exige "nesta ordem exata" e marca as duas como obrigatórias.
- [ ] #12 Faltam testes do #3 para a tentativa obsoleta (`doneEvent` ≠ `awaiting`), do #6 para o 409 com run encerrado e do #4 para a ordenação do CSV mais recente; hoje só o ramo "tarefa humana" do #3 está coberto.
- [ ] #13 O ruído `Instance dispose`/`hung` continua em `npx vitest run` (segunda metade do #9, que só teve o `import type` resolvido): encerrar as instâncias que ficam aguardando evento antes de fechar o #9.

> Origem: /verify Phase 3 (2026-09-30) — Agentes + executar-flow

- [ ] #16 Testar o 413 de `POST /api/plans` acima de 2 MB e o `NonRetryableError` do plano ausente (`worker/workflow.ts:474`); checar `Content-Length` antes de `request.text()` (`worker/agent-api.ts:168`) para não ler corpos enormes — #11/#14 só têm teste de metade de cada um.

> Origem: /verify Phase 4 (2026-09-30) — UI da execução real

- [ ] #20 Registrar no plano/README que o campo manual de Asset_IDs saiu do start (`src/App.tsx`) e que os assets vêm do D6 via G03 (`worker/workflow.ts:414-415`, padrão `asset-1`), ou restaurá-lo para runs sem plano, porque a mudança ficou fora do change list da Phase 4.
- [ ] #21 Em casa multi-instância (N11→D8), `useRunData` guarda só a tarefa mais recente por nó (`src/hooks/useRunData.ts:62-65`): avaliar agrupar por `nodeId+item` para o TaskPanel mostrar o estado de cada asset.

> Origem: /verify Phase 5 (2026-09-30) — UI mobile first


  Usar `min-h-9 sm:min-h-0`.

> Origem: /verify Phase 6 (2026-09-30) — CMS em /admin

- [ ] #29 No deploy não inline (`wrangler.jsonc:12`, `not_found_handling: single-page-application`), `/admin/<sub-rota>` cai no `index.html` do workflow. Hoje o CMS só usa `/admin/`. Documentar a limitação no README ou usar `run_worker_first` para `/admin/*` se o CMS passar a ter rotas por URL.

> Origem: /verify Phase 7 (2026-10-01) — Entrypoint único

- [ ] #30 `buildPublishPrompt`/`section` (`worker/cms-api.ts:41-54`, `:57-101`) põem os valores do CMS crus no prompt: delimitar os dados (cercas ou escape de `<`/`>`) e serializar não-strings com `JSON.stringify`, para um campo com `</tarefa>` não fechar a estrutura e objetos não virarem `[object Object]`.
- [ ] #32 `POST /api/cms/campaigns` (`worker/cms-api.ts:172-175`): uma exceção de `MY_WORKFLOW.create` vira 500 sem o envelope `fail`; envolver em try/catch e responder 502 com mensagem clara.

> Origem: /verify Phase 8 (2026-10-01) — Deploy e run real

- [ ] #33 A Routine "EXECUTAR · fila de agentes" (trig_01WZa3SYTZLHFZndDPqbtJWf) não tem repositório anexado, então a sessão disparada pode não encontrar a skill `/executar-flow` nem os agentes; anexar o repositório (ou embutir as instruções no prompt) e rodar um `fire_trigger` de teste.
- [ ] #34 O `EXECUTAR_AGENT_TOKEN` (e `EXECUTAR_URL`) precisa ser copiado pelo usuário para as variáveis de ambiente da Routine/ambiente cloud (Edit → variáveis de ambiente); sem isso a fila não é processada. Nunca colar o token no chat.
- [ ] #35 Publicação real de teste no blog (abre PR em `executar-23/Risco-cognitivo-blog`) não foi executada: pede confirmação do usuário; rodar "Publicar no blog" num conteúdo publicável e conferir o PR pronto (não draft).

