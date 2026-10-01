---
name: executar-plan-mode
description: >
  Transforma prompts brutos, extensos, ambíguos ou multidisciplinares em planos de execução
  estruturados, rastreáveis e verificáveis antes de qualquer implementação. Use quando o usuário
  pedir para planejar pesquisa, auditoria, implementação, migração, documentação, criação de
  arquivos, workflows de agentes, Codex ou Claude Code; quando for necessário separar planejamento
  de execução; ou quando o prompt precisar de fases, dependências, gates, entregáveis e Definition of Done.
user-invocable: false
---

# Executar Plan Mode

## Finalidade

Converter uma intenção bruta em um plano operacional executável sem antecipar a execução.

Transformação canônica:

`INTENÇÃO → CONTEXTO → ESCOPO → REGRAS → EVIDÊNCIAS → DEPENDÊNCIAS → FASES → GATES → ENTREGÁVEIS → DoD → STOP`

Esta Skill atua como camada de planejamento entre o pedido do usuário e qualquer agente executor.

## Regra-mestra

> Planejar primeiro. Executar somente após autorização explícita.

Estado padrão:

```text
MODE = PLAN
EXECUTION_APPROVED = false
```

Enquanto `MODE = PLAN`:

- operar em leitura sempre que possível;
- analisar contexto, arquivos, normas, contratos e dependências;
- não modificar artefatos do projeto;
- não publicar;
- não fazer merge;
- não fazer deploy;
- não executar migrações;
- não afirmar implementação;
- produzir apenas o plano e os artefatos de planejamento autorizados.

Execução só pode ser considerada liberada quando houver autorização explícita e inequívoca.

## Contratos obrigatórios

Antes de produzir um plano, carregar os contratos relevantes:

1. `contracts/PLAN-MODE-CORE.contract.md`
2. `contracts/CODEX-PLAN-MODE.contract.md` quando o alvo for Codex/OpenAI.
3. `contracts/CLAUDE-CODE-PLAN-MODE.contract.md` quando o alvo for Claude Code/Anthropic.
4. `contracts/EVIDENCE-TRACEABILITY.contract.md` quando houver pesquisa, fontes, documentação, normas ou fatos.
5. `contracts/OUTPUT-QUALITY.contract.md` para todos os planos.

Quando o alvo não estiver especificado, aplicar o contrato CORE e produzir um plano neutro de fornecedor.

## Política de precedência

A ordem operacional é:

1. instruções de sistema/plataforma;
2. instruções explícitas do usuário;
3. regras canônicas do repositório ou workspace;
4. contratos desta Skill;
5. referências;
6. inferências.

Nunca use uma referência como se fosse uma regra normativa sem que um contrato a tenha incorporado.

## Estados não equivalentes

Preservar rigorosamente:

`EXISTENTE ≠ COMPLETO ≠ APROVADO ≠ IMPLEMENTADO ≠ TESTADO ≠ VERIFICADO ≠ PUBLICADO`

Nunca elevar o estado de um item sem evidência.

## Não inventar

Nunca invente:

- owner;
- prazo;
- orçamento;
- aprovação;
- path canônico;
- arquivo existente;
- status;
- norma;
- contrato;
- fonte;
- URL;
- tecnologia;
- dependência;
- requisito.

Use:

`Não determinado`

ou:

`UNRESOLVED`

quando necessário.

## Classificação epistêmica

Quando houver afirmações factuais relevantes:

- `A · OBSERVADO` — diretamente observado.
- `B · PRIMÁRIO` — fonte primária verificável.
- `C · PUBLICADO` — fonte secundária publicada.
- `D · INTERNO` — regra, decisão ou documento interno.
- `E · INFERIDO` — análise, hipótese ou recomendação.

Nunca apresente `E` como `A`, `B` ou `C`.

# Workflow

## Fase 00 — Intake

Extrair:

- pedido literal;
- objetivo;
- resultado esperado;
- destinatário;
- domínio;
- contexto;
- restrições;
- autorizações;
- fontes citadas;
- arquivos;
- ferramentas;
- tecnologias;
- dependências;
- formato de saída.

Produzir internamente um `INTAKE`.

## Fase 01 — Classificação

Classificar a tarefa principal:

- Pesquisa
- Produto
- Engenharia
- Arquitetura
- Design
- Editorial
- Dados
- Operação
- Governança
- Auditoria
- Migração
- Documentação
- Planejamento
- Conteúdo

Registrar classes secundárias quando existirem.

## Fase 02 — Reconnaissance

Quando houver repositório, workspace ou arquivos:

1. localizar regras;
2. localizar contratos;
3. localizar schemas;
4. localizar arquivos de autoridade;
5. mapear diretórios;
6. identificar fonte de verdade;
7. detectar conflitos;
8. detectar lacunas.

Não propor estrutura definitiva antes de compreender a existente.

## Fase 03 — Ambiguidades

Criar registro com:

```text
ITEM
RAW_VALUE
NORMALIZED_VALUE
STATUS
CONFIDENCE
IMPACT
ACTION
```

Não corrigir silenciosamente nomes, referências ou tecnologias.

## Fase 04 — Project Charter

Gerar:

```text
PROBLEMA
OBJETIVO
PERGUNTA CENTRAL
ESCOPO
FORA DE ESCOPO
ENTRADAS
SAÍDAS
RESTRIÇÕES
DEPENDÊNCIAS
RISCOS
CRITÉRIOS DE SUCESSO
CRITÉRIO DE ENCERRAMENTO
```

Usar `templates/PROJECT-CHARTER.template.md`.

## Fase 05 — Mapa de dependências

Determinar:

- precedências;
- bloqueios;
- paralelismo;
- bifurcações;
- fontes de verdade;
- decisões críticas.

Usar representação simples:

```text
A → B → C
A → D
C + D → E
```

## Fase 06 — Decomposição em fases

Cada fase deve conter:

```text
FASE
OBJETIVO
INPUT
AÇÕES
OUTPUT
DEPENDÊNCIAS
EVIDÊNCIAS
GATE
NEXT
```

Uma fase deve representar avanço verificável.

## Fase 07 — Entregáveis

Todo entregável deve ser concreto.

Evitar entregáveis vagos como:

- analisar;
- melhorar;
- estudar;
- otimizar.

Preferir artefatos verificáveis.

## Fase 08 — Quality Gates

Cada gate deve possuir critério de PASS/FAIL.

Formato:

```text
GATE XX · NOME

PASS:
- condição;
- condição.

FAIL:
- condição bloqueante.
```

## Fase 09 — Definition of Done

Gerar checklist objetiva.

O DoD deve responder:

1. o que existe ao final?
2. como verificar?
3. o que ainda não está autorizado?
4. qual condição encerra o workflow?

## Fase 10 — Prompt executor

Somente quando a finalidade for entregar instrução para outro agente, gerar uma versão executora.

Usar:

`templates/EXECUTOR-PROMPT.template.md`

e o adapter específico:

- Codex: `adapters/codex/AGENTS.template.md`
- Claude Code: `adapters/claude-code/CLAUDE.template.md`

## Fase 11 — Stop

Em Plan Mode, encerrar com:

```text
PLAN_READY
EXECUTION_APPROVED = false
AWAITING_EXECUTION_APPROVAL
```

Não executar a tarefa planejada.

# Mapa argumentativo

Quando a tarefa envolver pesquisa, estratégia, escrita, síntese ou decisão, produzir:

```text
PERGUNTA CENTRAL
↓
TESE
↓
BLOCO 01
↓
BLOCO 02
↓
...
↓
CONCLUSÃO
```

Cada bloco:

```text
FUNÇÃO
CLAIM
EVIDÊNCIA
INTERPRETAÇÃO
CONEXÃO
TRANSIÇÃO
```

Regra:

`1 BLOCO = 1 MOVIMENTO DO ARGUMENTO`

Usar `templates/ARGUMENT-MAP.template.md`.

# Storyboard de execução

Quando houver workflow longo:

```text
FRAME
INPUT
ACTION
OUTPUT
EVIDENCE
GATE
NEXT
```

Usar `templates/WORKFLOW-STORYBOARD.template.md`.

# Estrutura de saída padrão

## 1. Diagnóstico

```text
OBJETIVO
TIPO
ESCOPO
COMPLEXIDADE
AMBIGUIDADES
DEPENDÊNCIAS
RISCOS
TARGET_AGENT
```

## 2. Project Charter

## 3. Mapa de dependências

## 4. Plano de execução

## 5. Entregáveis

## 6. Quality Gates

## 7. Definition of Done

## 8. Prompt executor

Somente quando aplicável.

## 9. Stop state

```text
PLAN_READY
AWAITING_EXECUTION_APPROVAL
```

# Critérios de qualidade

Um plano só é válido se outra pessoa ou agente puder responder sem interpretação adicional:

1. O que deve ser feito?
2. Por quê?
3. O que entra?
4. O que não entra?
5. Qual a ordem?
6. O que depende de quê?
7. Qual artefato deve existir?
8. Como cada fase termina?
9. Quais evidências sustentam decisões?
10. Qual condição impede o avanço?
11. Em qual ponto o agente deve parar?
12. O que exige autorização posterior?

# Anti-patterns

Não produzir:

```text
1. Pesquisar
2. Analisar
3. Implementar
4. Testar
```

sem detalhamento de inputs, outputs, dependências e gates.

Não:

- executar durante planejamento;
- inventar autoridade;
- transformar inspiração em contrato;
- criar diretórios arbitrários;
- declarar verificação sem teste;
- declarar aprovação sem aprovação;
- usar excesso de fases em tarefa simples.

# Granularidade

Referência:

- simples: 3–5 fases;
- média: 5–9 fases;
- complexa: 8–15 fases.

A granularidade é determinada por dependências e gates, não pelo tamanho do texto original.

# Recursos desta Skill

## Contracts

`contracts/`

Regras normativas de planejamento, Codex, Claude Code, evidência e qualidade.

## References

`references/`

Contexto não normativo e crosswalk entre fornecedores.

## Templates

`templates/`

Estruturas reutilizáveis para charter, plano, prompt executor, argument map e storyboard.

## Schemas

`schemas/`

Schemas JSON para validação programática.

## Adapters

`adapters/`

Camada de integração com Codex e Claude Code.

## Scripts

`scripts/`

Validadores locais e sem dependências externas.

# Encerramento obrigatório

Se o usuário solicitou somente planejamento:

```text
PLAN_READY
AWAITING_EXECUTION_APPROVAL
```

Se o usuário autorizou explicitamente a execução posterior, o plano pode registrar:

```text
EXECUTION_APPROVED = true
```

mas ainda deve concluir o artefato de planejamento antes de iniciar execução.

## Integração executar-cop
_Seção acrescentada por executar-23 em 2026-09-27 (skill proprietária do EXECUTAR, pacote EXECUTAR-OPERACOES)._
- **ID verbal:** CV-PLANO-001 (`/plano`). Nó `EXEC-PLAN-MODE` em `../../references/grafo-dependencias.json` (camada 1).
- **Pré-voo de dependências:** aplicar `../../references/nucleo-dependencias.md` antes de agir, declarando o resultado antes de procurar entradas; o plano declara dependências entre etapas com tag epistêmica e o que precisa existir primeiro. Feche com `Dependências de entrada → Saída → Gate`.
- **Idioma:** toda saída visível sai em português do Brasil.
