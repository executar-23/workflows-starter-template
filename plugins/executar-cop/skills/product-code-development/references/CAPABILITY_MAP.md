# Capability Map — Product + Engineering

## Product Management

| ID | Capability | Papel no ciclo |
|---|---|---|
| PM01 | product-brainstorming | explorar problema, hipóteses, alternativas e experimentos |
| PM02 | synthesize-research | converter pesquisa/feedback em temas, evidências e oportunidades |
| PM03 | competitive-brief | comparar mercado/produtos e extrair implicações sem copiar soluções |
| PM04 | write-spec | transformar problema validado em spec/PRD, requisitos e AC |
| PM05 | roadmap-update | ordenar outcomes/iniciativas por prioridade, dependência e horizonte |
| PM06 | sprint-planning | converter prioridade em escopo executável de curto prazo |
| PM07 | metrics-review | verificar sinais, metas, tendências e aprendizado |
| PM08 | stakeholder-update | comunicar progresso, decisões, riscos e próximos marcos |

## Engineering

| ID | Capability | Papel no ciclo |
|---|---|---|
| ENG01 | architecture | definir organização técnica macro e decisões estruturais |
| ENG02 | system-design | detalhar capability: fluxo, APIs, dados, falhas, escala |
| ENG03 | code-review | avaliar correção, segurança, performance e manutenção |
| ENG04 | debug | reproduzir, isolar, diagnosticar e corrigir causa raiz |
| ENG05 | testing-strategy | definir arquitetura de qualidade e níveis de teste |
| ENG06 | deploy-checklist | gate de implantação e rollback |
| ENG07 | documentation | registrar operação técnica após o comportamento existir |
| ENG08 | incident-response | triagem, mitigação, recuperação e aprendizado de produção |
| ENG09 | standup | consolidar estado operacional do trabalho |
| ENG10 | tech-debt | inventariar e priorizar dívida com base em impacto |

## Cadeia combinada

`PM01/PM02/PM03 → PM04 → ENG01 → ENG02 → WF-03 CODE PLAN → PM05/PM06 → WF-04 BUILD → ENG03/ENG04 → ENG05 → ENG06 → PM07 → PM08 → ENG09/ENG10/ENG08`

Nem toda missão exige a cadeia inteira. Use o mínimo suficiente.
