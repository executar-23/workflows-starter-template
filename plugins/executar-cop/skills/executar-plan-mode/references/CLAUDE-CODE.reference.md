# Claude Code · Reference

## Função nesta Skill

Adaptar planos para execução posterior por Anthropic Claude Code.

## Conceitos relevantes

- `CLAUDE.md` fornece contexto persistente do projeto;
- instruções podem existir em diferentes níveis do filesystem;
- Agent Skills usam diretório com `SKILL.md`;
- `SKILL.md` atua como ponto de entrada;
- progressive disclosure recomenda mover conteúdo especializado para arquivos auxiliares;
- tools, MCP, hooks e subagents são dependências explícitas, não presumidas.

## Aplicação

Quando `TARGET_AGENT = CLAUDE_CODE`, carregar:

`contracts/CLAUDE-CODE-PLAN-MODE.contract.md`

e usar:

`adapters/claude-code/CLAUDE.template.md`
