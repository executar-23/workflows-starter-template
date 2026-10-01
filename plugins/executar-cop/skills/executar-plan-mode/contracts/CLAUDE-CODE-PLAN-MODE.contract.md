# CLAUDE-CODE-PLAN-MODE · Contract

ID: CONTRACT-CLAUDE-CODE-PLAN-001  
Status: ACTIVE_WITHIN_SKILL  
Version: 1.0  
Target: Anthropic Claude Code

## Authority model

Ao planejar para Claude Code:

1. identificar instruções explícitas da tarefa;
2. localizar `CLAUDE.md` e arquivos equivalentes aplicáveis;
3. mapear contexto de projeto, parent e child directories quando relevante;
4. carregar Skills apenas quando semanticamente aplicáveis;
5. usar progressive disclosure: `SKILL.md` central curto e referências profundas em arquivos auxiliares.

## MUST

1. MUST localizar `CLAUDE.md` aplicável quando o trabalho estiver em repositório.
2. MUST tratar instruções de projeto como contexto operacional.
3. MUST separar Plan Mode de execução.
4. MUST usar a Skill como diretório: `SKILL.md` + recursos auxiliares.
5. MUST manter `SKILL.md` como ponto de entrada e delegar detalhes a `contracts/`, `references/`, `templates/` e `schemas/`.
6. MUST registrar ferramentas, hooks, MCPs ou subagents como dependências somente quando existirem ou forem explicitamente requeridos.
7. MUST indicar verificações planejadas.
8. MUST encerrar sem alterações quando execução não estiver autorizada.

## MUST NOT

1. MUST NOT inventar MCP servers, hooks, subagents ou permissões.
2. MUST NOT alterar `CLAUDE.md` durante planejamento sem autorização.
3. MUST NOT assumir que memória/instrução global substitui instrução de projeto.
4. MUST NOT carregar todo o corpus de referência sem necessidade.
5. MUST NOT confundir disponibilidade de uma ferramenta com autorização de uso.

## Recommended executor header

```text
TARGET_AGENT = CLAUDE_CODE
MODE = PLAN
EXECUTION_APPROVED = false
```

## Recommended planning sequence

```text
CONTEXT_DISCOVERY
→ CLAUDE_INSTRUCTION_MAP
→ SKILL_SELECTION
→ CURRENT_STATE
→ TARGET_STATE
→ GAP_ANALYSIS
→ TOOL_DEPENDENCIES
→ EXECUTION_PHASES
→ VALIDATION_PLAN
→ QUALITY_GATES
→ DEFINITION_OF_DONE
→ STOP
```

## Skill packaging rule

O diretório deve manter:

```text
executar-plan-mode/
├── SKILL.md
├── contracts/
├── references/
├── templates/
├── schemas/
├── examples/
├── adapters/
└── scripts/
```

Não depender de `README.md` dentro do diretório da Skill.
