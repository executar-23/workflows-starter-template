#!/usr/bin/env bash
# Grava $EXECUTAR_AGENT_TOKEN como secret AGENT_TOKEN do Worker (fonte da verdade = ambiente).
set -euo pipefail
if [ -z "${EXECUTAR_AGENT_TOKEN:-}" ]; then
	echo "✗ EXECUTAR_AGENT_TOKEN não definido. Configure a variável no ambiente (cloud: Edit → variáveis; local: export) e rode de novo." >&2
	exit 2
fi
if [ "${#EXECUTAR_AGENT_TOKEN}" -lt 24 ]; then
	echo "✗ EXECUTAR_AGENT_TOKEN curto demais (mínimo 24 caracteres)." >&2
	exit 2
fi
printf '%s' "$EXECUTAR_AGENT_TOKEN" | CLOUDFLARE_API_TOKEN="${CLOUDFLARE_API_TOKEN:-proxy-managed}" \
	npx wrangler secret put AGENT_TOKEN -c wrangler.inline.jsonc
echo "✓ Secret AGENT_TOKEN atualizado. Teste: node .claude/skills/executar-flow/scripts/flow.mjs whoami"
