# CODEX-PLAN-MODE · Contract

ID: CONTRACT-CODEX-PLAN-001  
Status: ACTIVE_WITHIN_SKILL  
Version: 1.0  
Target: OpenAI Codex

## Authority model

Ao planejar para Codex:

1. identificar instruções explícitas da tarefa;
2. localizar `AGENTS.md` e `AGENTS.override.md` aplicáveis;
3. respeitar escopo por diretório;
4. considerar instruções mais específicas no escopo aplicável;
5. tratar documentação do repositório como fonte de verdade quando o projeto assim definir.

## MUST

1. MUST realizar reconnaissance antes de propor mudanças estruturais.
2. MUST localizar e ler arquivos `AGENTS.md` aplicáveis ao alvo.
3. MUST registrar quais instruções governam quais paths.
4. MUST descrever tarefas como mudanças verificáveis, preferencialmente com paths, componentes e critérios de aceitação.
5. MUST separar plano de patch/execução.
6. MUST incluir comandos de verificação planejados quando conhecidos.
7. MUST preservar ambiente e permissões como restrições.
8. MUST definir explicitamente o stop state.
9. MUST indicar quando informação do repositório é desconhecida.
10. MUST evitar transformar `AGENTS.md` em enciclopédia; preferir apontar para documentação profunda quando essa arquitetura existir.

## MUST NOT

1. MUST NOT assumir que um único `AGENTS.md` governa todo o repositório.
2. MUST NOT editar arquivos enquanto estiver em Plan Mode.
3. MUST NOT afirmar que testes passaram se não foram executados.
4. MUST NOT fazer commit, push, PR, merge ou deploy por inferência.
5. MUST NOT ignorar instruções scoped.

## Recommended executor header

```text
TARGET_AGENT = CODEX
MODE = PLAN
EXECUTION_APPROVED = false
```

## Recommended planning sequence

```text
REPO_RECONNAISSANCE
→ INSTRUCTION_SCOPE_MAP
→ CURRENT_STATE
→ TARGET_STATE
→ GAP_ANALYSIS
→ DEPENDENCY_MAP
→ EXECUTION_PHASES
→ VERIFICATION_PLAN
→ QUALITY_GATES
→ DEFINITION_OF_DONE
→ STOP
```

## Evidence basis

Este contrato foi desenhado para ser compatível com a orientação pública da OpenAI sobre:
- uso de `AGENTS.md`;
- escopo por diretório;
- instruções persistentes;
- prompts estruturados como issues/PRs;
- ambientes verificáveis e testes.
