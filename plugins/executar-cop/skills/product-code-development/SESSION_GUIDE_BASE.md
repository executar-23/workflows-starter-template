# SESSION GUIDE BASE — leitura obrigatória na primeira ativação

Objetivo: obter contexto operacional suficiente antes de escolher um workflow. Esta etapa é de entendimento da sessão; não é um convite para transformar a missão em documentação.

## 1. Detecte o modo

Classifique a sessão como uma ou mais:
- PLAN — planejar futura modificação de código;
- EXECUTION — implementar;
- REVIEW — revisar diff/PR/código;
- DEBUG — investigar defeito;
- RELEASE — validar/publicar;
- OPERATIONS — incidente, standup, dívida, manutenção;
- PRODUCT — discovery, pesquisa, spec, roadmap, métricas.

Se o ambiente estiver em Plan Mode, a saída principal deve ser um CODE IMPLEMENTATION PLAN.

## 2. Descubra os papéis dos repositórios

Identifique, sem presumir:
- `SOT_REPO`: requisitos, ADRs, specs, contratos, evidências;
- `IMPLEMENTATION_REPO`: onde código é alterado;
- repos de referência, design system, infra ou upstream.

Nunca escreva no SOT apenas porque ele foi consultado.

## 3. Leia instruções locais

Procure, quando existirem: `CLAUDE.md`, `AGENTS.md`, `.claude/rules/`, skills do projeto, README, CONTRIBUTING, package manifests, CI, architecture/ADR/specs.

Regras locais mais específicas prevalecem, desde que não conflitem com segurança.

## 4. Faça assessment do código real

Mapeie stack/runtime, apps/packages, dependências, banco/auth, rotas/APIs, integrações, testes, CI/CD, env, deployment, stubs/mocks/placeholders e dívida técnica.

Não derive estado de documentação quando o código puder ser inspecionado.

## 5. Defina o resultado

Converta a missão em comportamento observável: o que funcionará, para quem, em qual superfície e qual evidência demonstrará conclusão.

## 6. Resolva SOT e baseline

Determine decisões canônicas, defaults do framework/template, pontos proprietários e decisões difíceis de reverter.

## 7. Classifique evidência

Use quando aplicável: `CORPUS_DIRECT`, `CORPUS_DERIVED`, `GAP`, `PROPOSED`.

Benchmark ou decisão nova não pode ser apresentada como requisito antigo.

## 8. Escolha capabilities e workflow

Use `references/CAPABILITY_MAP.md` e `workflows/WORKFLOW_INDEX.md`. Para produto amplo, prefira WF-09. Para Plan Mode orientado a código, prefira WF-03.

## 9. Fixe gates

Identifique gates reais: arquitetura, schema/migrations, auth/security, AC, tests, build, deploy e release.

## 10. Evite overplanning

Planeje em detalhe a próxima faixa executável; mantenha visão de milestones para o restante. Expanda tasks conforme se tornam elegíveis.

## Session Contract

Ao final desta leitura o agente deve saber:
`MODE + SOT + TARGET + BASELINE + CURRENT STATE + OUTCOME + CONSTRAINTS + WORKFLOW + FIRST NEXT ACTION`.

Se um item material estiver desconhecido, pesquise o repo ou use a política de GAP; não preencha por imaginação.
