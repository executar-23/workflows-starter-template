# Backlog

> Origem: /verify Phase 1 (2026-09-30) — Execução real por agentes Claude Code no fluxo EXECUTAR

- [ ] #1 Rework do G05 roda o bloco multi-instância N11→D8 sem `item` e reinicia a iteração do G04 (`workflow.ts:417` → `rework` em `:429-440` → `execGate(node, item)` em `:451` ignora `iteration`): grava em prefixo sem item e, num segundo rework, repete o nome de step do G04 (decisão reaproveitada do cache); hoje é latente porque D8 já é conferido por item antes do G05, mas deve iterar por asset e propagar a iteração para gates aninhados.
- [ ] #2 No timeout de agente (`workflow.ts:239-242`) marcar a tarefa anterior como expirada no TaskBoard e voltar a READY (novo OK) como diz o plano, para não deixar tarefa órfã `despachada` que um agente ainda consegue concluir sem efeito.
- [🔄] #3 `POST /api/tasks/:id/complete` aceita tarefas `aguardando-humano` e tentativas antigas (`agent-api.ts:100-123`): recusar quando `status === "aguardando-humano"` ou quando `doneEvent` não é o `awaiting.eventType` atual do run, para o agente não pular casa humana nem concluir tarefa obsoleta.
- [🔄] #4 G03 lê o primeiro `.csv` em ordem alfabética do prefixo do D6 (`workflow.ts:345`): usar o mais recente (`uploaded`) para que uma correção com outro nome de arquivo seja a checada no retrabalho.
- [🔄] #5 `GET /api/tasks?limit=abc` gera `LIMIT NaN` e `limit=-1` remove o limite (`agent-api.ts:79`, `task-board.ts:153`): normalizar para inteiro entre 1 e 500.
- [🔄] #6 `sendDone` sem try/catch (`agent-api.ts:31-34`, usado em `:116` e `:199`): run encerrado vira exceção 500; responder 409 com mensagem clara.
- [🔄] #7 Comparação do Bearer com `!==` (`agent-api.ts:45`): trocar por comparação em tempo constante (`crypto.subtle.timingSafeEqual`).
- [ ] #8 `completedAt: new Date()` fora de `step.do` (`workflow.ts:256`, `:282`) muda a cada replay: capturar a data dentro do step de conferência.
- [🔄] #9 Remover o import de valor não usado `WorkflowStep` (`workflow.ts:1`, virar `import type`) e silenciar o ruído `Instance dispose`/`hung` dos testes que terminam com instância aguardando evento.

> Origem: /verify Phase 2 (2026-09-30) — Plano Ops upstream

- [ ] #10 `validatePlanCsv` não confere a ordem exata das colunas 1–22 nem a obrigatoriedade de `prioridade`/`tags` (`shared/plan.ts:47`, `:62`): o `schema-csv-tarefas.md` exige "nesta ordem exata" e marca as duas como obrigatórias.
- [🔄] #11 "Carregar plano upstream" lança `Error` comum quando o plano some (`worker/workflow.ts:473`), o que faz o step tentar de novo com backoff: usar `NonRetryableError`; `start` com `planId` não-string escapa da checagem 404 (`worker/index.ts:66`).
- [ ] #12 Faltam testes do #3 para a tentativa obsoleta (`doneEvent` ≠ `awaiting`), do #6 para o 409 com run encerrado e do #4 para a ordenação do CSV mais recente; hoje só o ramo "tarefa humana" do #3 está coberto.
- [ ] #13 O ruído `Instance dispose`/`hung` continua em `npx vitest run` (segunda metade do #9, que só teve o `import type` resolvido): encerrar as instâncias que ficam aguardando evento antes de fechar o #9.
- [🔄] #14 `POST /api/plans` não limita o tamanho do corpo e `GET /api/plans/:id` expõe os prompts completos sem auth (`worker/agent-api.ts:166`, `:307`): avaliar um limite de payload e o escopo da resposta pública.

> Origem: /verify Phase 3 (2026-09-30) — Agentes + executar-flow

- [🔄] #15 Fechar de fato o escopo público dos prompts (#14): continuam acessíveis sem auth por `GET /api/artifacts/plans/<id>/linear-import.csv` (chave exposta em `plan.files`, `worker/agent-api.ts:327`, `:345-356`) e por `GET /api/runs/:id/tasks` (`task.prompt` com `<prompt_do_plano>`, `:338-339`): exigir AGENT_TOKEN para chaves `plans/` e omitir o prompt na listagem pública, ou registrar DECISION de que prompts são públicos (a UI da Phase 4 os mostra).
- [ ] #16 Testar o 413 de `POST /api/plans` acima de 2 MB e o `NonRetryableError` do plano ausente (`worker/workflow.ts:474`); checar `Content-Length` antes de `request.text()` (`worker/agent-api.ts:168`) para não ler corpos enormes — #11/#14 só têm teste de metade de cada um.
- [🔄] #17 Nos 4 agentes (`.claude/agents/*.md:11`), escrever os comandos por extenso (`node .claude/skills/executar-flow/scripts/flow.mjs show …`) em vez de `F=…`/`$F`: o shell não persiste entre chamadas Bash e `$F` não casa com o allow de `.claude/settings.json`, travando o modo headless/Routine.
- [🔄] #18 Endurecer o parse do `flow.mjs` (`:35-48`, `:181-187`): flag sem valor vira `"true"` (`--gap` vazio envia GAP "true"), valores iniciados por `--` não passam e `--evidence` repetido quebra com `TypeError`; incluir `--agent` no passo `complete` do protocolo para `by` coincidir com `claimedBy`.
- [🔄] #19 No `clp-orchestrator.md:37`, separar PG05 (sem entregável) de N17 → D12 · pacote de agendamento, para o guia por casa refletir o destino real de upload (hoje só o prompt indica D12).

> Origem: /verify Phase 4 (2026-09-30) — UI da execução real

- [ ] #20 Registrar no plano/README que o campo manual de Asset_IDs saiu do start (`src/App.tsx`) e que os assets vêm do D6 via G03 (`worker/workflow.ts:414-415`, padrão `asset-1`), ou restaurá-lo para runs sem plano, porque a mudança ficou fora do change list da Phase 4.
- [ ] #21 Em casa multi-instância (N11→D8), `useRunData` guarda só a tarefa mais recente por nó (`src/hooks/useRunData.ts:62-65`): avaliar agrupar por `nodeId+item` para o TaskPanel mostrar o estado de cada asset.
- [🔄] #22 Corrigir a indentação do bloco `ExecutorBadge`/`NodeBadges`/`TaskPanel` em `src/components/ListView.tsx:84-88` (um tab a menos que os irmãos); o `task.md` da Phase 4 dava como corrigida, mas a mudança não entrou em `bbc84e3`. Só cosmético.

> Origem: /verify Phase 5 (2026-09-30) — UI mobile first

- [🔄] #23 O banner fixo cobre o fim da página no celular: o `pb-44` (176 px) está no `<main>` (`src/App.tsx:311`), mas o `<Legend />` vem depois (`:317`). O banner mede 204 px no modo evidência a 390×844 e pode chegar a 60vh, cobrindo cerca de 170 px do footer ao rolar até o fim. Mover o padding para o container raiz, depois do Legend, e dimensioná-lo pela altura real do banner (ResizeObserver → variável CSS).
- [🔄] #24 Alvos de toque abaixo da meta de 36 px da Phase 5 no celular:
  - "Concluir casa" com 33 px (`src/components/Execution.tsx:150`) e StepActions compact com cerca de 33 px (`src/components/Taxonomy.tsx:233`);
  - botão JSON com 32 px (`src/App.tsx:266-271`);
  - abas do `Segmented` com 24 px (`src/components/KanbanView.tsx:116`);
  - "Copiar"/"✕" do drawer com 24 px (`src/components/JsonDrawer.tsx:140`, `:147`);
  - "Iniciar run"/"Novo run" com 28 px.

  Usar `min-h-9 sm:min-h-0`.
- [🔄] #25 No modo compact, o rótulo "PGxx · join" fica à direita do losango (`src/components/FlowChart.tsx:279`) e o trilho direito entra pelo vértice direito, riscando o texto: pôr o rótulo do join à esquerda.
- [🔄] #26 No modo compact, o wrapper do bloco paralelo (`src/components/FlowChart.tsx:410`) não é `w-full`, então os cards dos ramos do PG01 ficam com 188 px, enquanto os do PG03 e os demais ficam com 300 px: adicionar `w-full` no modo compact para a largura ficar consistente.

> Origem: /verify Phase 6 (2026-09-30) — CMS em /admin

- [🔄] #27 #23 continua com padding fixo `pb-52 sm:pb-0` (`src/App.tsx:161`), e o banner de ação pode chegar a 60vh no modo evidência. Dimensionar pela altura real (ResizeObserver → variável CSS) para não cobrir o fim da página.
- [🔄] #28 `POST /api/auth/login` não limita tentativas (`worker/hub-api.ts`). Antes do deploy da Phase 8, adicionar um rate limit simples, por exemplo um contador por IP com janela no HubStoreDO ou uma regra de WAF, para reduzir força bruta no `ADMIN_TOKEN`.
- [ ] #29 No deploy não inline (`wrangler.jsonc:12`, `not_found_handling: single-page-application`), `/admin/<sub-rota>` cai no `index.html` do workflow. Hoje o CMS só usa `/admin/`. Documentar a limitação no README ou usar `run_worker_first` para `/admin/*` se o CMS passar a ter rotas por URL.

> Origem: /verify Phase 7 (2026-10-01) — Entrypoint único

- [ ] #30 `buildPublishPrompt`/`section` (`worker/cms-api.ts:41-54`, `:57-101`) põem os valores do CMS crus no prompt: delimitar os dados (cercas ou escape de `<`/`>`) e serializar não-strings com `JSON.stringify`, para um campo com `</tarefa>` não fechar a estrutura e objetos não virarem `[object Object]`.
- [ ] #31 O limite de login (`worker/hub-api.ts:134-140`) é global e checado antes do token: 10 falhas de qualquer origem barram o `ADMIN_TOKEN` correto por 15 min (lockout), e `loginFailures`/`noteLoginFailure` são RPCs separados, não atômicos. Contar por `CF-Connecting-IP` num único `checkAndNote` do HubStoreDO.
- [ ] #32 `POST /api/cms/campaigns` (`worker/cms-api.ts:172-175`): uma exceção de `MY_WORKFLOW.create` vira 500 sem o envelope `fail`; envolver em try/catch e responder 502 com mensagem clara.
