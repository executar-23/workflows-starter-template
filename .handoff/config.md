# Handoff Config

## Verification Commands

test:      npx vitest run
typecheck: npx tsc -b
lint:      npx eslint .
build:     npm run build

> Single package (npm). Deploy (not a verification step): `npm run build && node scripts/build-inline-assets.mjs && CLOUDFLARE_API_TOKEN=proxy-managed npx wrangler deploy -c wrangler.inline.jsonc`.

## Conventions

response_language: pt-BR
handoff_dir:       .handoff
commit_style:      conventional (mensagens em pt-BR)
convention_docs:   CLAUDE.md

## Project Documentation Index

### Agent guidance
- [CLAUDE.md](CLAUDE.md) — regras do agente na raiz
- [.claude/agents/](.claude/agents/) — subagentes do fluxo EXECUTAR
- [.claude/skills/](.claude/skills/) — skills locais (handoff, plano ops, executar-flow)

### Project docs
- [README.md](README.md) — visão geral, API e deploy
- [workflow.json](workflow.json) — grafo de dependências (fonte única do fluxo)
- [shared/schema.ts](shared/schema.ts) — tipos e helpers compartilhados Worker/UI

### Detected toolchain
- package manager: npm (package-lock.json)
- monorepo: não
- frameworks: Cloudflare Workers + Workflows + Durable Objects, React 19 + Vite + Tailwind v4, Vitest (vitest-pool-workers)
