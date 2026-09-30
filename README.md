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
  "strategicPillar": "pilar editorial"
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

Eventos esperados: `g01-approved`, `author-package-ready`, `g02-approved`, `g03-approved`, `g04-approved`, `g05-approved`, `g06-approved`.

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
