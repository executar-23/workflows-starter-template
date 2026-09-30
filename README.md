# Programa EXECUTAR — Cloudflare Workflows

Implementação do workflow editorial do Programa EXECUTAR sobre o template oficial de Cloudflare Workflows, com execução durável, gates humanos, atualização em tempo real por WebSocket e API HTTP pública.

## Deploy

Após merge para `main`, use:

https://deploy.workers.cloudflare.com/?url=https://github.com/executar-23/workflows-starter-template

Ou via Wrangler:

```bash
npm install
npm run deploy
```

O `wrangler.jsonc` está configurado com `workers_dev: true`. Depois do deploy, a URL pública será informada pelo Wrangler no formato `https://programa-executar-workflow.<subdomain>.workers.dev`.

## API

### Health

```http
GET /api/health
```

### Iniciar workflow

```http
POST /api/workflow/start
Content-Type: application/json

{
  "campaignId": "campanha-001",
  "assetIds": ["A1", "A2"]
}
```

### Status

```http
GET /api/workflow/status/:instanceId
```

### Enviar evento/gate

```http
POST /api/workflow/event/:instanceId
Content-Type: application/json

{
  "type": "g01-approved",
  "payload": {
    "approved": true,
    "comment": "Aprovado"
  }
}
```

### Passo a passo (WIP = 1)

Cada casa (atividade, entregável, subprocesso, distribuição e gate automático) só executa após um OK. Os nós estruturais (START, END, gateways) passam sozinhos, e os ramos paralelos são percorridos um de cada vez. Cada casa espera um tipo de evento único, que a UI recebe pelo WebSocket no campo `awaiting`:

- OK de casa: `ok-<nó>[-<asset>][-r<tentativa>]`, por exemplo `ok-n1`, `ok-n11-a1`, `ok-n1-r2`
- decisão de gate humano: `<evento>[-<asset>][-r<tentativa>]`, por exemplo `g01-approved`, `g04-approved-a1`

Gates humanos (owner LEONARDO) e seus eventos: `g01-approved` (G01 · Pilar definido?), `g04-approved` (G04 · Visual OK?, um por Asset_ID) e `g06-approved` (G06 · Peças finais OK?). Envie `approved: false` para reprovar: o workflow executa o loop de retrabalho definido em `onReject`.

Os gates G02, G03 e G05 são automáticos (ORCH: CLP) e verificam os predecessores listados em `check`.

`POST /api/workflow/start` aceita `campaignId` e `assetIds` (lista de Asset_IDs para o subprocesso multi-instância N11 → D8).

### WebSocket

```text
/ws?instanceId=:instanceId
```

## Segurança

A API funciona publicamente por padrão. Para exigir autenticação, configure o secret `API_TOKEN`:

```bash
npx wrangler secret put API_TOKEN
```

Depois envie `Authorization: Bearer <token>` nas rotas da API.

## Estrutura do workflow

O fluxo implementa as 8 fases do mapa XMind enviado:

1. Estratégia
2. Pesquisa
3. Autoria Humana
4. Conversão Agentic
5. Produção Visual
6. Produção Audiovisual
7. Revisão e Release
8. Tracking e Analytics

## Deploy

`npm run deploy` usa o upload padrão de static assets do Wrangler. Em ambientes
em que esse endpoint não está disponível (ex.: proxy que injeta credenciais),
use `npm run deploy:inline`, que embute a UI no próprio Worker
(`wrangler.inline.jsonc`).

## Schema (`workflow.json` v2)

Grafo de dependências do AGENT_PROMPT_CONTRACT: cada nó tem `kind` (forma BPMN), `phase` e `dependsOn` (única fonte de posição e setas). Owner, orch, agent, skill, tool, format e ids são metadados exibidos como badges. `shared/schema.ts` tipa o JSON para Worker e UI.

## UI

Três modos (Fluxograma, Kanban, Lista), aba recolhível com o `workflow.json` e legenda. O run fica na URL (`?run=<id>`) para retomar um gate depois.

## Operar os agentes (execução real)

1. **Token (uma vez):** defina `EXECUTAR_AGENT_TOKEN` (valor aleatório com 24 ou mais caracteres) e `EXECUTAR_URL` como variáveis do ambiente Claude Code (cloud: menu do ambiente → Edit → variáveis; local: `export`). Numa sessão nova, rode `npm run agent:token` para gravar o mesmo valor como secret `AGENT_TOKEN` do Worker.
2. **Teste:** `node .claude/skills/executar-flow/scripts/flow.mjs whoami` deve responder `✓`.
3. **Plano do mês (opcional):** peça ao `plano-ops-agent` para gerar o plano a partir do intake. Ele roda o juiz e envia; use o `planId` ao iniciar o run.
4. **Executar:**
   - Casas humanas: entregue a evidência pela UI.
   - Casas de agente: dê OK na UI e rode `/executar-flow`, ou mantenha `/loop 10m /executar-flow` ativo.
   - Sem sessão: a Routine cloud "EXECUTAR · fila de agentes" processa a fila de hora em hora ("Run now" para disparar na hora).
   - Headless local: `claude -p "/executar-flow" --permission-mode acceptEdits`.

As rotas dos agentes (`/api/tasks*`, `PUT /api/runs/:id/artifacts/*`, `POST /api/plans`) exigem `Authorization: Bearer <AGENT_TOKEN>`. Sem o secret configurado, elas respondem 503.

> **Risco aceito:** a UI é pública, então qualquer pessoa com a URL entrega evidência humana, aprova gates e lê os prompts das tarefas do run (`GET /api/runs/:id/tasks`). Os arquivos do plano upstream (`plans/*`) exigem `AGENT_TOKEN`. Para restringir a UI, coloque o Worker atrás do Cloudflare Access.
