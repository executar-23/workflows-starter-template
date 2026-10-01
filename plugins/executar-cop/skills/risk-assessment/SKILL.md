---
name: risk-assessment
description: Identify, assess, and mitigate operational risks. Trigger with "what are the risks", "risk assessment", "risk register", "what could go wrong", or when the user is evaluating risks associated with a project, vendor, process, or decision.
user-invocable: false
---

# Risk Assessment

Systematically identify, assess, and plan mitigations for operational risks.

## Risk Assessment Matrix

| | Low Impact | Medium Impact | High Impact |
|---|-----------|---------------|-------------|
| **High Likelihood** | Medium | High | Critical |
| **Medium Likelihood** | Low | Medium | High |
| **Low Likelihood** | Low | Low | Medium |

## Risk Categories

- **Operational**: Process failures, staffing gaps, system outages
- **Financial**: Budget overruns, vendor cost increases, revenue impact
- **Compliance**: Regulatory violations, audit findings, policy breaches
- **Strategic**: Market changes, competitive threats, technology shifts
- **Reputational**: Customer impact, public perception, partner relationships
- **Security**: Data breaches, access control failures, third-party vulnerabilities

## Risk Register Format

For each risk, document:
- **Description**: What could happen
- **Likelihood**: High / Medium / Low
- **Impact**: High / Medium / Low
- **Risk Level**: Critical / High / Medium / Low
- **Mitigation**: What we're doing to reduce likelihood or impact
- **Owner**: Who is responsible for managing this risk
- **Status**: Open / Mitigated / Accepted / Closed

## Output

Produce a prioritized risk register with specific, actionable mitigations. Focus on risks that are controllable and material.

## Integração executar-cop
_Seção acrescentada por executar-23 em 2026-09-27. O restante deste arquivo é conteúdo original da Anthropic (knowledge-work-plugins), sob licença Apache-2.0; ver `../../THIRD_PARTY_NOTICES.md`._
- **ID verbal:** CV-RISCO-001 (`/risco`). Nó `OPS-RISK-ASSESSMENT` em `../../references/grafo-dependencias.json` (camada 2).
- **Pré-voo de dependências:** aplicar `../../references/nucleo-dependencias.md` antes de agir; riscos de dependência (cadeia bloqueante, ciclo, externo) entram no registro de riscos. Feche com `Dependências de entrada → Saída → Gate`.
- **Busca web:** obrigatória quando o risco depender de fato externo (regulação, mercado, plataforma); verifique e cite a fonte.
- **Idioma:** toda saída visível sai em português do Brasil, mesmo que as instruções desta skill estejam em inglês.
