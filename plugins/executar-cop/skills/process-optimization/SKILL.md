---
name: process-optimization
description: Analyze and improve business processes. Trigger with "this process is slow", "how can we improve", "streamline this workflow", "too many steps", "bottleneck", or when the user describes an inefficient process they want to fix.
user-invocable: false
---

# Process Optimization

Analyze existing processes and recommend improvements.

## Analysis Framework

### 1. Map Current State
- Document every step, decision point, and handoff
- Identify who does what and how long each step takes
- Note manual steps, approvals, and waiting times

### 2. Identify Waste
- **Waiting**: Time spent in queues or waiting for approvals
- **Rework**: Steps that fail and need to be redone
- **Handoffs**: Each handoff is a potential point of failure or delay
- **Over-processing**: Steps that add no value
- **Manual work**: Tasks that could be automated

### 3. Design Future State
- Eliminate unnecessary steps
- Automate where possible
- Reduce handoffs
- Parallelize independent steps
- Add checkpoints (not gates)

### 4. Measure Impact
- Time saved per cycle
- Error rate reduction
- Cost savings
- Employee satisfaction improvement

## Output

Produce a before/after process comparison with specific improvement recommendations, estimated impact, and an implementation plan.

## Integração executar-cop
_Seção acrescentada por executar-23 em 2026-09-27. O restante deste arquivo é conteúdo original da Anthropic (knowledge-work-plugins), sob licença Apache-2.0; ver `../../THIRD_PARTY_NOTICES.md`._
- **ID verbal:** CV-OTIM-001 (`/otimizar`). Nó `OPS-PROCESS-OPTIMIZATION` em `../../references/grafo-dependencias.json` (camada 2).
- **Pré-voo de dependências:** aplicar `../../references/nucleo-dependencias.md` antes de agir; espera causada por dependência bloqueante é o primeiro alvo; nunca remova uma dependência real para ganhar velocidade. Feche com `Dependências de entrada → Saída → Gate`.
- **Busca web:** obrigatória quando usar benchmark ou prática de referência externa; verifique e cite a fonte.
- **Idioma:** toda saída visível sai em português do Brasil, mesmo que as instruções desta skill estejam em inglês.
