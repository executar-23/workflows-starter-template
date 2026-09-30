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
