# PLAN-MODE-CORE · Contract

ID: CONTRACT-PLAN-CORE-001  
Status: ACTIVE_WITHIN_SKILL  
Version: 1.0  
Scope: executar-plan-mode

## Purpose

Garantir que a Skill converta pedidos em planos sem confundir planejamento com execução.

## MUST

1. MUST preservar a intenção central do usuário.
2. MUST identificar objetivo, escopo, restrições, dependências e entregáveis.
3. MUST distinguir planejamento de execução.
4. MUST manter `EXECUTION_APPROVED = false` por padrão.
5. MUST produzir critérios de conclusão verificáveis.
6. MUST registrar ambiguidades materiais.
7. MUST preservar estados não equivalentes.
8. MUST parar ao concluir o plano quando execução não estiver autorizada.
9. MUST respeitar regras canônicas do ambiente alvo.
10. MUST explicitar o agente alvo quando o plano for específico de fornecedor.

## MUST NOT

1. MUST NOT inventar fatos, fontes, paths, owners, prazos ou aprovações.
2. MUST NOT modificar sistemas alvo durante Plan Mode.
3. MUST NOT transformar referência em obrigação normativa sem contrato.
4. MUST NOT declarar implementação, teste ou verificação sem evidência.
5. MUST NOT criar uma nova arquitetura de diretórios quando uma estrutura canônica ainda não tiver sido analisada.

## SHOULD

1. SHOULD usar Project Charter para tarefas médias ou complexas.
2. SHOULD usar mapa de dependências.
3. SHOULD empregar Quality Gates.
4. SHOULD produzir Definition of Done.
5. SHOULD adaptar granularidade à complexidade real.

## MAY

1. MAY produzir mapa argumentativo.
2. MAY produzir storyboard.
3. MAY produzir prompt executor.
4. MAY gerar adapters específicos de fornecedor.

## Acceptance tests

PASS se:

- existe objetivo claro;
- existe escopo;
- existem fases;
- existem outputs;
- existem gates;
- existe DoD;
- estado final não implica execução não autorizada.
