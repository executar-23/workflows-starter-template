# Benchmark — iteração 1 (skill-creator, 2026-09-27)

Fixture FICTÍCIA (tests/fixtures). Asserções em evals.json; notas por script (grading programático).

| Caso | Com skill | Sem skill |
|---|---|---|
| reconstrucao-completa | 10/10 | 5/10 |
| sem-planilha | 4/4 | 4/4 (asserções não discriminantes: a base também não inventa) |

Pass rate: 100% com skill × 75% sem skill; tempo equivalente (~222 s); +15,5 mil tokens com skill.

Falhas da base no caso completo: sem as três partes e sem a tabela de 9 colunas; ciclo A03↔A04 deixado pendente (não resolvido); GAP de 12_REG_Portfolio não declarado; arquivos fora do formato do validador.

Ajuste pós-iteração: registro_para_colar.csv formalizado (as duas configurações o criaram espontaneamente).
