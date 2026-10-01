---
name: compliance-tracking
description: Track compliance requirements and audit readiness. Trigger with "compliance", "audit prep", "SOC 2", "ISO 27001", "GDPR", "regulatory requirement", or when the user needs help tracking, preparing for, or documenting compliance activities.
user-invocable: false
---

# Compliance Tracking

Help track compliance requirements, prepare for audits, and maintain regulatory readiness.

## Common Frameworks

| Framework | Focus | Key Requirements |
|-----------|-------|-----------------|
| SOC 2 | Service organizations | Security, availability, processing integrity, confidentiality, privacy |
| ISO 27001 | Information security | Risk assessment, security controls, continuous improvement |
| GDPR | Data privacy (EU) | Consent, data rights, breach notification, DPO |
| HIPAA | Healthcare data (US) | PHI protection, access controls, audit trails |
| PCI DSS | Payment card data | Encryption, access control, vulnerability management |

## Compliance Tracking Components

### Control Inventory
- Map controls to framework requirements
- Document control owners and evidence
- Track control effectiveness

### Audit Calendar
- Upcoming audit dates and deadlines
- Evidence collection timelines
- Remediation deadlines

### Evidence Management
- What evidence is needed for each control
- Where evidence is stored
- When evidence was last collected

### Gap Analysis
- Requirements vs. current state
- Prioritized remediation plan
- Timeline to compliance

## Output

Produce compliance status dashboards, gap analyses, audit prep checklists, and evidence collection plans.

## Integração executar-cop
_Seção acrescentada por executar-23 em 2026-09-27. O restante deste arquivo é conteúdo original da Anthropic (knowledge-work-plugins), sob licença Apache-2.0; ver `../../THIRD_PARTY_NOTICES.md`._
- **ID verbal:** CV-CONF-001 (`/conformidade`). Nó `OPS-COMPLIANCE-TRACKING` em `../../references/grafo-dependencias.json` (camada 2).
- **Pré-voo de dependências:** aplicar `../../references/nucleo-dependencias.md` antes de agir; cada critério aponta para a evidência e o Gate que ele satisfaz; o que falta vira GAP. Feche com `Dependências de entrada → Saída → Gate`.
- **Busca web:** obrigatória para confirmar a versão vigente de cada norma; verifique e cite a fonte.
- **Idioma:** toda saída visível sai em português do Brasil, mesmo que as instruções desta skill estejam em inglês.
