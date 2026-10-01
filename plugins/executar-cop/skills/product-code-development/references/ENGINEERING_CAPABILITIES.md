# Engineering Capabilities — síntese integrada

Estas capacidades são adaptação funcional, não cópia dos arquivos do plugin original.

## ENG01 · Architecture
Defina estrutura macro, boundaries, runtimes, banco, auth, comunicação e infraestrutura. Produza opções, trade-offs, decisão e consequências. Não detalhar cada função interna.

## ENG02 · System Design
Para capability concreta, especifique fluxo, componentes, API/commands/events, modelo de dados, concorrência, cache, falhas, observabilidade, escala, segurança e testabilidade.

## ENG03 · Code Review
Revise mudanças reais. Priorize correctness, security, performance, data integrity, edge cases, error handling, maintainability e aderência aos padrões do repo. Diferencie blockers de melhorias.

## ENG04 · Debug
`reproduzir → observar → reduzir hipóteses → coletar evidência → causa raiz → menor correção → regression test → verificar`. Evite tentativa e erro sem hipótese.

## ENG05 · Testing Strategy
Mapeie risco para nível de teste: regra pura→unit; DB/provider→integration; API→contract; jornada→E2E; IA→eval; segurança→abuse/authorization tests. Teste comportamento.

## ENG06 · Deploy Checklist
Confirme review, migrations, env/secrets, CI, tests, observability, rollback, health/smoke tests, compatibilidade e known risks. Saída: PASS / FAIL / BLOCKED.

## ENG07 · Documentation
Documente comportamento real, setup, contracts, API, runbooks e troubleshooting após código/evidência. Nunca promova estado só porque foi documentado.

## ENG08 · Incident Response
Triage impacto/severidade; estabilize; comunique; mitigue; recupere; preserve timeline/evidência; faça análise de causa e follow-ups preventivos.

## ENG09 · Standup
Consolide concluído, em andamento, bloqueios, riscos e próxima ação. Fundamente em Git/issues quando disponíveis.

## ENG10 · Tech Debt
Identifique duplicação, hacks, dependências antigas, ausência de testes, acoplamento, inconsistência e hotspots. Priorize por risco/impacto/custo, não estética.
