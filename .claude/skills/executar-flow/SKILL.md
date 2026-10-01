---
name: executar-flow
description: Processa a fila de tarefas reais do workflow EXECUTAR (Cloudflare) com WIP = 1. Pega a próxima tarefa despachada, delega ao subagente do executor (clp-orchestrator, research-agent, plano-ops-agent, analytics-agent), sobe os artefatos no R2 e conclui com evidência. Use quando o usuário pedir /executar-flow, "rodar a fila", "processar tarefas do EXECUTAR", "executar a casa do agente", ou para enviar o plano do mês (modo upstream com a skill plano-operacional-rastreavel).
---

# Executar Flow: fila de agentes do Programa EXECUTAR

O workflow (Cloudflare Workflows) publica uma tarefa por casa com um **prompt self-contained**. Em casa de agente, a tarefa só é despachada depois do OK humano. Esta skill leva cada tarefa despachada até a entrega real: artefato no R2 + evidência. O Worker confere o R2 antes de acender a casa.

CLI: `node .claude/skills/executar-flow/scripts/flow.mjs` (`help` lista os comandos).

## Pré-requisitos

1. As variáveis `EXECUTAR_URL` e `EXECUTAR_AGENT_TOKEN` precisam estar no ambiente. Nunca peça o token no chat.
2. `node .claude/skills/executar-flow/scripts/flow.mjs whoami` deve imprimir `✓`. Se der exit 2 (token ausente), 401 ou 503, **pare** e informe o usuário:
   - 503 = o secret do Worker não foi configurado (rodar `npm run agent:token`);
   - 401 = o token do ambiente difere do secret.

## Procedimento (modo fila, WIP = 1)

Repita até a fila esvaziar ou até 10 rodadas:

1. `node .claude/skills/executar-flow/scripts/flow.mjs next`. Se não imprimir nada, a fila está vazia: encerre com um resumo.
2. Leia `executor` e `taskId` do JSON e delegue **uma** tarefa ao subagente correspondente com a ferramenta Agent, passando o `taskId`:

   | executor | subagente |
   |---|---|
   | `agent:clp` | `clp-orchestrator` |
   | `agent:research` | `research-agent` |
   | `agent:plano-ops` | `plano-ops-agent` |
   | `agent:analytics` | `analytics-agent` |
   | `agent:blog-publisher` | `blog-publisher` (tarefas do CMS, `runId = cms`: publicar no blog) |

   Subagentes não disparam outros subagentes, então o roteamento é sempre feito aqui, pela sessão principal.
3. Aguarde o subagente terminar. Confira com `node .claude/skills/executar-flow/scripts/flow.mjs tasks --run <runId>` se a tarefa ficou `concluida`. Se o subagente relatar bloqueio, **não** conclua a tarefa por ele: registre no resumo e siga para a próxima.
4. Não processe duas tarefas em paralelo (WIP = 1).

Resumo final: tarefas concluídas (`taskId`, casa, artefatos), bloqueios e GAPs declarados.

## Modo upstream (plano do mês)

Quando o usuário fornecer o intake (JSON do formulário ou texto livre) e pedir o plano, delegue ao `plano-ops-agent` no **modo upstream**. Ele gera o pacote com a skill `plano-operacional-rastreavel`, roda o juiz `validar_plano.py` e envia com `flow.mjs plan-upload`. O `planId` retornado é usado no início do run (UI ou `POST /api/workflow/start {planId}`).

## Decisões fixas

- **DEC-EXF-01. Vínculo TSK → casa:** uma tarefa do plano vira o prompt de uma casa quando a coluna `tags` contém `no-<nó>`, por exemplo `no-n4` para N4 (Wide Search) ou `no-n10` para N10. É uma tag por casa; a primeira TSK encontrada prevalece.
- **DEC-EXF-02. Não inventar:** dado ausente vira `TBD` no artefato e **GAP** na conclusão (`--gap`). Executor, função ou fonte "A DEFINIR" nunca são substituídos por uma suposição.
- **DEC-EXF-03. Evidência:** toda conclusão descreve o que foi feito, com base em quê (fontes/URLs, artefatos de entrada) e onde está o resultado (chaves R2).
- **DEC-EXF-04. Local de trabalho:** os arquivos intermediários ficam em `out/<runId>/<nó>/`, pasta ignorada pelo git.

## Execução contínua

- Sessão aberta: `/loop 10m /executar-flow`.
- Sem sessão: a Routine cloud "EXECUTAR · fila de agentes" roda `/executar-flow` de hora em hora. Para disparar na hora, peça numa sessão "dispare a routine EXECUTAR" ou use "Run now" em claude.ai.
- Máquina local (cron): `claude -p "/executar-flow" --permission-mode acceptEdits`.
