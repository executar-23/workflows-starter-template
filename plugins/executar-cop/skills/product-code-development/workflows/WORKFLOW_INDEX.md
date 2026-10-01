# Workflow Index

| ID | Nome | Use quando |
|---|---|---|
| WF-00 | Session Intake | toda primeira ativação |
| WF-01 | Product Discovery & Research | problema, ideia, usuário, benchmark |
| WF-02 | Architecture & System Design | decisões macro ou capability técnica |
| WF-03 | Code Implementation Plan | Plan Mode / futura implementação |
| WF-04 | Vertical Slice Build | execução incremental de código |
| WF-05 | Review & Debug | PR/diff, defeito, regressão |
| WF-06 | Testing & Deploy | qualidade e release gate |
| WF-07 | Operate & Evolve | produção, standup, incidente, dívida, aprendizado |
| WF-08 | GAP Resolution | especificação técnica ausente/bloqueante |
| WF-09 | Product-to-Production | ciclo integrado completo |

Fluxo mestre:
`WF-00 → [WF-01] → WF-02 → WF-03 → WF-04 → WF-05 → WF-06 → WF-07`

`WF-08` pode ser chamado em qualquer etapa.
