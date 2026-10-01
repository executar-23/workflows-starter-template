# Programa EXECUTAR — Linha de Produção Editorial

Worker Cloudflare (Workflows + Durable Objects + R2) com UI React. O fluxo inteiro vem de `workflow.json`, tipado por `shared/schema.ts`.

## Operar o fluxo (execução real)

- **Casas humanas:** o Leonardo entrega evidência ou arquivo pela UI.
- **Casas de agente:** depois do OK na UI, a tarefa é despachada e um agente Claude Code a executa:
  - `/executar-flow` roda uma passada na fila (WIP = 1, uma tarefa por vez);
  - `/loop 10m /executar-flow` mantém a fila rodando enquanto a sessão estiver aberta;
  - para rodar sem sessão aberta (headless/cron): `claude -p "/executar-flow" --permission-mode acceptEdits`;
  - Routine cloud "EXECUTAR · fila de agentes": roda de hora em hora, ou na hora pelo "Run now".
- **Subagentes** (`/agents`): `clp-orchestrator`, `research-agent`, `plano-ops-agent`, `analytics-agent` e `blog-publisher` (publicação no blog a partir do CMS).
- **CMS (`/admin`):** Hub Editorial do blog Risco Cognitivo. No conteúdo: "Iniciar campanha" abre um run com `campaignId = CNT-RC-*`; "Publicar no blog" despacha uma tarefa para o `blog-publisher`, que abre um PR pronto no `executar-23/Risco-cognitivo-blog`.
- **Plano do mês (upstream):** delegue ao `plano-ops-agent` com o intake. Ele usa a skill `plano-operacional-rastreavel`, passa o plano pelo juiz `validar_plano.py` e envia com `flow.mjs plan-upload`. Depois, inicie o run com o `planId` retornado.
- **Diagnóstico:** `node .claude/skills/executar-flow/scripts/flow.mjs whoami` e `node .claude/skills/executar-flow/scripts/flow.mjs tasks --status despachada`.

## Credenciais

- `EXECUTAR_URL` e `EXECUTAR_AGENT_TOKEN` são **variáveis do ambiente**: cloud em Edit → variáveis de ambiente; local em `export` ou em `.claude/settings.local.json`. Nunca cole o token no chat nem o grave no repositório.
- `npm run agent:token` sincroniza o token do ambiente com o secret `AGENT_TOKEN` do Worker.

## Fluxo Git e issues

- **Nunca criar PR em rascunho (draft).** Se um PR for necessário, abra-o já pronto para revisão. Vale mesmo quando o ambiente ou uma ferramenta sugerir draft por padrão.
- **Trabalho direto na `main`.** O padrão é commitar e dar push na `main`. Antes do push: `git pull --rebase origin main`, `npx vitest run`, `npx eslint .`, `npx tsc -b` e `npm run build`.
- **Branches paralelas.** Com mais de uma frente independente ao mesmo tempo (várias sessões ou agentes), cada frente usa sua própria branch curta (`git worktree add ../<nome> -b <tipo>/<nome>`), com escopo de arquivos disjunto. Ao terminar, integre na `main` (merge ou rebase, sem PR draft), apague a branch e remova o worktree. Uma frente única vai direto na `main`.
- **Issues no GitHub, não no chat.** Nunca devolva listas de issues, pendências ou achados por aqui: registre cada item como issue do repositório com as ferramentas `mcp__github__*` (`issue_write`; cheque duplicatas com `search_issues`) e responda só com o link e um resumo de uma linha. O `.handoff/backlog.md` é o rascunho local do ciclo; os itens abertos viram issues.

## Regras

- **Não inventar:** dado ausente é `TBD` e vira GAP; "A DEFINIR" continua "A DEFINIR".
- **Mudanças de código:** seguir o Agent Handoff (`/plan` → `/execute` → `/verify` em contexto novo), com estado em `.handoff/`.
- **Verificação:** `npx vitest run`, `npx eslint .`, `npm run build` e, para tipos, `npx tsc -b`.
- **Deploy** (conta Cloudflare padrão: Hub.executar; app em https://workflows-starter-template.hub-executar.workers.dev, bucket R2 `executar-artifacts`): `npm run build && node scripts/build-inline-assets.mjs && CLOUDFLARE_API_TOKEN=proxy-managed npx wrangler deploy -c wrangler.inline.jsonc`.
