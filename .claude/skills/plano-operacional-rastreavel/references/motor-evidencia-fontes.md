# Motor de Evidência, IDs e Hierarquia de Fontes

Este é o núcleo metodológico que garante que dois clientes diferentes, processados pela mesma skill, produzam documentos com o mesmo padrão de rigor — mesmo com conteúdos totalmente diferentes.

## Prefixos de ID (estáveis, nunca renumerar depois de criados)

| Prefixo | Significa |
|---|---|
| SRC | Fonte (documento, formulário, planilha, etc.) |
| EVD | Evidência observável específica |
| NRM | Requisito normativo (ISO) |
| REQ | Requisito operacional |
| OBJ | Objetivo do mês |
| KR | Resultado mensurável |
| TSK | Tarefa |
| DEP | Dependência |
| STK | Stakeholder |
| RSK | Risco |
| DEC | Decisão aprovada |
| ASM | Suposição não verificada |
| GAP | Informação ou evidência ausente |
| MET | Métrica |
| GATE | Gate de decisão/validação |
| CONF | Conflito entre fontes |
| FACT | Fato observável |

Cada item material recebe: ID único, enunciado normalizado, fonte exata (documento + seção/linha/data quando disponível), citação literal ou trecho fiel, classificação, status de evidência, dependência, ação resultante.

## Classificação obrigatória de toda afirmação relevante

- **FACT** — sustentado explicitamente por uma fonte identificável.
- **DECISION** — aprovada ou escolhida explicitamente (pelo cliente ou por regra da empresa).
- **REQUIREMENT** — obrigação derivada de fonte válida.
- **CONSTRAINT** — limite documentado que afeta a execução.
- **ASSUMPTION** — plausível, mas não verificada. Rotular sempre como tal, nunca disfarçar de fato.
- **HYPOTHESIS** — proposição que precisa ser testada.
- **RECOMMENDATION** — ação aconselhada, não obrigação.
- **GAP** — evidência ou informação ausente.
- **CONFLICT** — fontes ou instruções incompatíveis.
- **NORMATIVE REQUIREMENT** — diretamente rastreável a uma cláusula normativa anexada (ver `normas-fixas-iso.md`).

Regra de linguagem: só use "deve"/"obrigatório" quando a origem for (a) instrução explícita do usuário nesta conversa, (b) decisão aprovada do cliente, (c) requisito de projeto já aprovado, ou (d) cláusula normativa aplicável. Caso contrário, use "recomendado"/"deveria" e identifique a base.

## Hierarquia de fontes (para resolver conflitos)

Da mais para a menos autoritativa:

1. Instruções explícitas desta conversa/prompt do usuário
2. Formulário mensal mais recente preenchido pelo cliente
3. Decisões explícitas já registradas em documentos do projeto do cliente
4. Documentos normativos anexados (o conjunto ISO fixo)
5. Registros operacionais e planos anteriores recentes
6. Contexto pessoal aprovado do cliente (capacidade, restrições cognitivas, preferências de trabalho — **não é evidência normativa**, apoia decisão mas não vira requisito)
7. Planilha ou arquivo legado — **apenas referência histórica**; nunca determina o plano novo sozinha. Rotular como LEGACY REFERENCE.
8. Registros antigos ou superados
9. Fontes externas (web) — rotular como EXTERNAL CURRENT SOURCE, com título, publicador, data de publicação/atualização, data de acesso, URL, fato exato sustentado, e se é fonte primária ou secundária.

**Nunca funda conflitos silenciosamente.** Para todo conflito material:
- identifique as duas fontes;
- diga qual foi priorizada;
- explique a regra de precedência usada;
- preserve a informação rejeitada/superada em um registro de conflitos (tabela CONF-XX) — nunca a apague.

## Regra da planilha legada

Se o cliente anexar uma planilha ou arquivo antigo de planejamento, ela pode ser usada só para identificar: categorias anteriores, lógica de planejamento prévia, responsabilidades recorrentes, campos ausentes, histórico de tarefas, padrões estruturais, itens que podem precisar de migração.

Não deve determinar o plano novo automaticamente. Não reproduzir: suposições obsoletas, prazos desatualizados, atividades duplicadas, prioridades sem sustentação, estimativas antigas apresentadas como fato atual. Todo item herdado precisa ser revalidado contra evidência mais recente.

## Regra de contexto pessoal

Usar contexto pessoal só onde afeta materialmente a execução: capacidade disponível, restrições de carga cognitiva, cadência preferida de trabalho, janelas de concentração, número de frentes simultâneas toleráveis, granularidade de tarefa preferida, gates de aprovação humana exigidos, obrigações recorrentes relevantes.

Contexto pessoal pode apoiar decisões de planejamento, mas **não é evidência normativa**. Nunca inferir diagnóstico médico, recomendação clínica, decisão de tratamento ou alegação de saúde a partir de contexto pessoal. Distinguir sempre: restrição pessoal documentada vs. interpretação operacional vs. suposição não verificada.

## Sequência de 7 fases (resumo operacional)

1. Inventário de fontes
2. Normalização (extrair objetivos, responsabilidades, prazos, métricas, restrições, dependências, stakeholders, decisões pendentes, riscos, tarefas recorrentes, referências normativas — preservando a redação original)
3. Validação de evidência (localizar fonte de cada item, checar se é observável e atual, detectar contradições e lacunas)
4. Modelo de capacidade do mês (capacidade nominal, indisponível, de execução planejada, reserva de contingência, com premissas explícitas — nunca alocar 100% do nominal). **Reserva de contingência: use sempre 15% da capacidade de execução planejada.** Este percentual é fixo da metodologia — não escolha outro valor por conta própria. Só use percentual diferente se o cliente/usuário pedir explicitamente; nesse caso, registre a escolha como DECISION (DEC-XX) na tabela §3.2, citando a fonte do pedido e o percentual adotado. O percentual usado deve aparecer declarado na linha de contingência da tabela de capacidade (§7 do documento interno), ex.: `Reserva de contingência | 5,1h (15%) | ...`
5. Priorização (só com critérios evidenciados: prioridade explícita, prazo obrigatório, criticidade de dependência, risco irreversível, valor de geração de evidência, esforço vs. capacidade disponível — nunca introduzir um framework de priorização novo além dos já fixos da empresa)
6. Construção do plano (objetivos mensais, resultados mensuráveis, resultados semanais, tarefas, responsáveis, stakeholders, dependências, prazos, métricas, gates de validação, itens adiados)
7. Cross-check final (toda tarefa comparada com a fonte; nenhuma restrição documentada descartada; sem duplicação; dependências antes de dependentes; carga cabe na capacidade; todo objetivo tem resultado mensurável; toda tarefa P0 tem dono+prazo+fonte+critério de conclusão; linguagem normativa rastreável a cláusula; recomendações não viram requisitos)

## Controles de qualidade — rejeitar/revisar saída que:

- introduz framework sem sustentação;
- atribui requisito só à Estrutura Harmonizada (Annex SL);
- cita norma sem cláusula ou localização identificável;
- alega conformidade só pela existência do documento;
- trata ausência de evidência como evidência de não conformidade;
- importa conteúdo obsoleto de planilha legada como verdade atual;
- confunde preferência pessoal com obrigação normativa;
- inventa stakeholder, data, baseline, hora ou métrica;
- sobrecarrega o mês além da capacidade documentada;
- produz atividade sem entregável observável;
- omite citação de fonte;
- omite dependência;
- esconde incerteza;
- reporta informação da web sem metadados de fonte.
