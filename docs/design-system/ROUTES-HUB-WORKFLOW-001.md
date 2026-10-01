# ROUTES-HUB-WORKFLOW-001 — toda nova rota ou link entra no hub

| Campo | Valor |
|---|---|
| ID | ROUTES-HUB-WORKFLOW-001 |
| Versão | 1.0.0 |
| Decisão | ADR-07 (`CLAUDE.md`) |
| Hub | `/admin/rotas/` (linkado em `/admin`) |
| Fonte única | `src/data/routes.ts` |
| Verificação | `npm run routes:check` → `tests/routes.spec.ts` |
| Status | IMPLEMENTED |

## Regra

Toda nova **rota** (página em `src/pages`, ferramenta em `public/<pasta>/index.html`, endpoint) e todo
novo **link gerado ou compartilhado** (preview de branch, deploy, link de compartilhamento, alvo de QR)
é registrado em `src/data/routes.ts` **no mesmo PR** que o cria.

Exceção automática: artigos de `src/content/blog` aparecem sozinhos em `/admin/rotas/`; não registre à mão.

## Passo a passo

```
NOVA ROTA OU LINK
│
├── 1. criar a página, a ferramenta ou gerar o link
├── 2. acrescentar a entrada em src/data/routes.ts
├── 3. npm run routes:check     lista o que falta
├── 4. abrir /admin/rotas/      conferir cartão, URL e QR
└── 5. marcar o checklist do PR (.github/pull_request_template.md)
```

## Entrada

```ts
// Rota deste site
{ id: "admin-rotas", title: "Rotas e links (QR)", group: "Interno (admin)", kind: "route",
  path: "/admin/rotas/", exposure: "internal", addedAt: "2026-09-30", source: "PR #1" }

// Link gerado (preview, deploy, compartilhamento)
{ id: "preview-loja", title: "Preview da loja", group: "Links gerados", kind: "link",
  url: "https://…workers.dev/loja/", exposure: "test", owner: "equipe", addedAt: "2026-10-02",
  source: "PR #7" }
```

| Campo | Regra |
|---|---|
| `id` | único, kebab-case |
| `group` | um de `ROUTE_GROUPS`; links gerados ficam em "Links gerados" |
| `kind: route` | `path` com barra inicial e final (`/blog/`), sem `url` |
| `kind: link` | `url` `https://…`, sem `path` |
| `exposure` | `public`, `internal` (existe sem guarda de autenticação, ex.: `/admin/*`) ou `test` |
| `addedAt` | `AAAA-MM-DD` |

## O que o teste bloqueia

- página, ferramenta ou endpoint existente sem entrada;
- entrada `route` sem rota no código;
- `id` ou `path` duplicado, grupo inválido, data inválida, link sem `https`;
- host de preview de branch como alvo de QR.

Além disso, o teste do navegador decodifica cada QR de `/admin/rotas/` e exige que seja igual à URL
exibida no cartão.

## Base dos QRs

`PUBLIC_ROUTES_BASE_URL` (variável de build). Padrão: o host de produção
`https://risco-cognitivo-blog.hub-executar.workers.dev`. Se o domínio mudar, altere
`DEFAULT_BASE_URL` em `src/data/routes.ts`.

## Origem

Substitui o catálogo `QR_ROUTES_RISCO_COGNITIVO.html` do pacote `PACOTE_QR_ROTAS_E_PYTHON.zip`, que apontava
para o preview da branch `claude/amazing-euler-cbzqnd` e incluía 31 rotas `/loja/*` inexistentes nesta
branch. Os módulos Python do pacote estão arquivados em `tools/qr-python/` (ver o README dele).
