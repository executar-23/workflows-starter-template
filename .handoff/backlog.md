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
