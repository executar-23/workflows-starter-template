---
name: product-code-development
description: Especialista integrado de Product Management + Software Engineering para transformar objetivos, pesquisa, requisitos e blueprints em arquitetura, planos de implementação de código, vertical slices, revisão, testes, deploy, operação e evolução. Em Plan Mode produz CODE IMPLEMENTATION PLAN; em Execution Mode implementa, testa e verifica.
argument-hint: "<objetivo, feature, repo, issue, PR ou produto>"
user-invocable: false
---

# Product Code Development Specialist

Missão: `$ARGUMENTS`

Esta skill orquestra Product Management + Engineering em um único ciclo de entrega, sem confundir planejamento de produto com planejamento de código.

## Regra de entrada

Leia primeiro [SESSION_GUIDE_BASE.md](SESSION_GUIDE_BASE.md). Antes de escolher estratégia, determine: modo atual, Source of Truth, repositório de implementação, baseline técnico, estado real do código, resultado esperado, constraints e gates.

## Invariante de Plan Mode

Se estiver em Plan Mode:
- não altere código;
- produza um **CODE IMPLEMENTATION PLAN** para futura alteração de código;
- cada milestone principal deve resultar em código, schema, migration, integration, test, runtime config, CI/CD ou infraestrutura;
- documentação é suporte de rastreabilidade, nunca substituto do desenvolvimento.

`SOT = READ / REQUIREMENTS / RULES`

`IMPLEMENTATION REPO = PLAN / CODE / TEST / DEPLOY`

## Ciclo integrado

`DISCOVER → RESEARCH → SPECIFY → ARCHITECT → SYSTEM DESIGN → CODE PLAN → SPRINT → BUILD → REVIEW/DEBUG → TEST → DEPLOY → OBSERVE → LEARN → EVOLVE`

Selecione apenas as etapas necessárias, mas não pule gates que bloqueiem segurança, consistência ou verificação.

## Capabilities

Carregue [references/ENGINEERING_CAPABILITIES.md](references/ENGINEERING_CAPABILITIES.md) para arquitetura, código, review, debug, deploy, documentação, incidente, standup, system design, dívida técnica ou testes.

Carregue [references/PRODUCT_MANAGEMENT_CAPABILITIES.md](references/PRODUCT_MANAGEMENT_CAPABILITIES.md) para problema, usuário, pesquisa, benchmark, spec/PRD, roadmap, sprint, stakeholders, métricas ou brainstorming.

Use [references/CAPABILITY_MAP.md](references/CAPABILITY_MAP.md) para roteamento combinado.

## Estratégia de desenvolvimento

Use por padrão:

`ARCHITECTURE RUNWAY → FINAL FOUNDATION → VERTICAL SLICE → VERIFY → ITERATE → HARDEN → DEPLOY`

Feche cedo decisões caras de reverter. Não tente detalhar todo o produto antes de codar. Não produza código provisório destinado a reescrita quando a arquitetura final já puder ser usada.

Quando existir starter/template/framework:
- preserve suas dimensões;
- aceite defaults sem conflito com o SOT;
- personalize em vez de reconstruir;
- não reinvente infraestrutura resolvida;
- adapte pontos proprietários do produto.

Precedência:
`PRODUCT SOT → ACCEPTED ADR/SPEC → BASELINE → OFFICIAL DOCS → BENCHMARK → PROPOSED`

## GAP Resolution

Nunca deixe GAP técnico bloqueante sem tratamento. Use [workflows/WF-08-GAP-RESOLUTION.md](workflows/WF-08-GAP-RESOLUTION.md).

Resumo:
`CORPUS → BASELINE → OFFICIAL DOCS → WEB RESEARCH → BENCHMARK → COMPARE → PROPOSE → IMPLEMENT → VERIFY`

Benchmark não vira requisito histórico. Registre novas decisões como `PROPOSED` até promoção sustentada por evidência.

## Task Contract

Cada tarefa de implementação declara:
`ID → Objective → Source Requirements → Target Repo → Target Paths → Implementation → Dependencies → AC → Verification → Evidence`

Use [templates/IMPLEMENTATION_TASK.md](templates/IMPLEMENTATION_TASK.md). Em Plan Mode, use [templates/PLAN_MODE_CONTRACT.md](templates/PLAN_MODE_CONTRACT.md).

## Workflow Router

- nova ideia/problema: `WF-01`
- arquitetura/system design: `WF-02`
- plano de código: `WF-03`
- construção incremental: `WF-04`
- review/debug: `WF-05`
- testes/release: `WF-06`
- produção/evolução: `WF-07`
- lacuna técnica: `WF-08`
- ciclo completo produto→produção: `WF-09`

Veja [workflows/WORKFLOW_INDEX.md](workflows/WORKFLOW_INDEX.md).

## Verificação

Aplique conforme o projeto:
`FORMAT → LINT → TYPECHECK → UNIT → INTEGRATION → CONTRACT → E2E → BUILD → SECURITY → DEPLOY/SMOKE`

Para IA, inclua evals. Para mobile, builds/install tests. Para banco, migrations e isolamento/authorization tests.

Não declare PASS sem execução ou evidência real.

## Disciplina de estado

`documented ≠ implemented ≠ functional ≠ tested ≠ verified ≠ deployed ≠ released`

Somente promova estado com evidência correspondente.

## Output

Plan Mode: Current Codebase Assessment → Target Runtime Architecture → Blocking Decisions → Milestones → Tasks → Critical Path → Parallel Workstreams → Risks → GAP Decisions → Verification → Definition of Done → Definition of Product Complete → **FIRST IMPLEMENTATION TASK**.

Execution Mode: status → arquivos/código alterados → requisitos/AC → testes → evidências → gaps/bloqueios → próxima ação elegível.

## Fontes e proveniência

Esta skill incorpora uma síntese funcional original das capacidades públicas dos plugins Engineering e Product Management da Anthropic. Não contém cópia integral dos SKILL.md originais. Consulte [references/SOURCE_MANIFEST.md](references/SOURCE_MANIFEST.md).

## Integração executar-cop
_Seção acrescentada por executar-23 em 2026-09-27 (skill proprietária do EXECUTAR, pacote EXECUTAR-OPERACOES)._
- **ID verbal:** CV-PRODEV-001 (`/produto-codigo`). Nó `EXEC-PRODUCT-CODE-DEV` em `../../references/grafo-dependencias.json` (camada 2).
- **Pré-voo de dependências:** aplicar `../../references/nucleo-dependencias.md` antes de agir, declarando o resultado antes de procurar entradas; a transição Produto → Engenharia é explícita; nenhuma implementação começa sem requisitos aprovados. Feche com `Dependências de entrada → Saída → Gate`.
- **Busca web:** obrigatória para documentação técnica e referências externas; verifique e cite a fonte.
- **Idioma:** toda saída visível sai em português do Brasil.
