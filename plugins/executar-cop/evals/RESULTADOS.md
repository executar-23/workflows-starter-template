# Resultados de `claude plugin eval` — 2026-09-27

Comando: `claude plugin eval plugins/executar-cop --runs 1 -j 4 --trust-plugin --no-publish` (Claude Code 2.1.283).
A ablação `with-without` também roda cada caso sem o plugin. Juiz LLM com 3 votos. Custo total: US$ 0,86. Duração: 117 s.

| Caso | Com plugin | Sem plugin | O que diferencia |
|---|---|---|---|
| `rotina-sinonimo-bomdia` | PASS (3/3 votos) | FAIL | Com plugin, resolve CV-BOMDIA-001 e declara bloqueado-externo porque `copiloto-executar` está ausente, sem inventar o dia. Sem plugin, responde só "Bom dia! Como posso ajudar?". |
| `operacoes-capacidade-sem-plugin` | PASS (3/3) | FAIL | Com plugin, faz o pré-voo, nomeia `operations@knowledge-work-plugins` ausente e mostra como instalar, sem números inventados. |
| `ambiguidade-mapa` | PASS (3/3) | FAIL | Com plugin, faz uma pergunta mínima entre /mapa (Mapa-OS) e a parte 2 de /dependencias. |
| `cadeia-bloqueio-interno` | PASS (3/3) | FAIL | Com plugin, identifica DEP-COP-001: /arvore fica bloqueado-interno até /dependencias. |

**Resultado:** 4/4 com o plugin e 0/4 sem ele.

O ambiente de avaliação não tem os plugins Anthropic nem as skills da conta. Por isso estes casos exercitam o roteamento, o pré-voo e o bloqueio externo, e não a execução dessas skills.

A avaliação da skill `executar-dependency-architect` pela skill-creator está em `../skills/executar-dependency-architect/evals/benchmark-iteracao-1.md`.

---

# v0.2.0 — 2026-09-27 (skills da Anthropic incorporadas)

O caso `operacoes-capacidade-sem-plugin` foi substituído por `operacoes-capacidade-pre-voo`: agora a skill é interna, e o critério passou a ser pré-voo sem inventar números.

| Caso | Com plugin | Sem plugin |
|---|---|---|
| `rotina-sinonimo-bomdia` | PASS (3/3 votos) | FAIL |
| `operacoes-capacidade-pre-voo` | PASS (3/3): pediu equipe, horas e demanda, sem inventar | FAIL |
| `ambiguidade-mapa` | PASS (3/3) | FAIL |
| `cadeia-bloqueio-interno` | **FAIL** (1ª rodada) → PASS 3/3 após a correção | FAIL |

**Falha encontrada.** Em 2 de 4 execuções, o agente foi procurar a planilha antes de explicar que `/arvore` depende de `/dependencias` (DEP-COP-001). A ordem seguida estava certa, mas a resposta não informava o bloqueio.

**Correção** (regra geral, não específica do caso):
- `nucleo-dependencias.md` §4 ganhou a "ordem de comunicação": o pré-voo é declarado antes de procurar ou pedir entradas;
- a mesma regra entrou no `orquestrador-cop` e no `cadeia-de-valor-proprietaria`.

**Reexecução do caso** (`--runs 3`): 3/3 PASS, com os três juízes aprovando em todas as execuções. Custo total da v0.2.0: cerca de US$ 1,40.
