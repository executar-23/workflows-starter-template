# Schema do Documento Interno (Entregável #1)

Estrutura fixa de 17 seções + 2 apêndices. Esta é a fonte de verdade da qual os entregáveis #2, #3 e #4 derivam. Preencher com os dados reais do intake — nunca deixar placeholders visíveis no arquivo final.

## Cabeçalho

```
Titular: [nome do titular] (nome completo — sinalizar CONFLITO se houver divergência entre fontes)
Período coberto: [DD/MM/AAAA] a [DD/MM/AAAA]
Data de emissão: [DD/MM/AAAA]
Fuso horário: [ex.: America/Sao_Paulo (BRT/GMT-3)]
Versão: 1.0 — emissão inicial (incrementar se houver revisão)
Metodologia de produção: motor de evidência com hierarquia de fontes e classificação rastreável
Natureza deste documento: planejamento operacional executável. Não é auditoria, certificação,
opinião legal, aprovação regulatória, nem declaração formal de conformidade normativa.
```

## 1. Resumo Executivo

- Objetivo operacional central do período
- Resultado mais importante esperado (com KR-XX e fonte)
- Capacidade realista total planejada (ver §7)
- Frentes ativas simultâneas no mês e limite semanal de WIP
- Restrição principal
- Risco principal
- Próxima ação imediata (remeter para §17)

## 2. Inventário de Fontes e Evidências

Tabela: `ID | Fonte | Tipo | Data/versão | Papel na análise | Confiabilidade/limitação`

Incluir subseção "Fontes NÃO consultadas (por escolha justificada)" quando aplicável (ex.: decisão de não usar web search), com o motivo e o ID de decisão (DEC-XX) correspondente.

## 3. Fatos, Decisões, Suposições, Lacunas e Conflitos

Subseções com tabelas separadas:

- **3.1 Fatos observáveis (FACT)** — `ID | Fato | Fonte | Citação literal/localização`
- **3.2 Decisões aprovadas (DECISION)** — `ID | Decisão | Fonte | Nota`
- **3.3 Suposições (ASSUMPTION)** — `ID | Suposição | Por que foi necessária | Risco se errada`
- **3.4 Lacunas (GAP)** — `ID | Lacuna | Fonte que deveria cobrir | Impacto | Ação recomendada`
- **3.5 Conflitos (CONFLICT)** — `ID | Fonte A | Fonte B | Fonte priorizada | Regra de precedência usada`

## 4. Limite Normativo e Disclaimer

Reproduzir claramente (ver `normas-fixas-iso.md`):
- frameworks operacionais próprios foram excluídos da seção normativa;
- afirmações normativas são rastreáveis às normas do conjunto fixo;
- evidência observável é exigida;
- ausência de cláusula ou registro impede conclusão;
- a Estrutura Harmonizada é usada só para organizar evidência;
- a análise não é auditoria, certificação nem declaração formal de conformidade.

## 5. Evidência Organizada pela Estrutura Harmonizada

Usar apenas os 7 cabeçalhos (Contexto, Liderança, Planejamento, Suporte, Operação, Avaliação de Desempenho, Melhoria).

Tabela: `Cabeçalho | Norma aplicável | Cláusula | Requisito | Evidência observável | Status | Lacuna/ação`

Não preencher requisito sem cláusula anexada que o sustente.

## 6. Objetivos do Mês e Resultados Mensuráveis

Tabela: `ID Objetivo | Objetivo do mês | Fonte | Resultado mensurável | Baseline | Meta do mês | Método de validação`

Usar no máximo quantos objetivos couberem na capacidade documentada (ver §7) — nunca inflar a lista para parecer completo.

## 7. Capacidade e Alocação do Mês

Tabela: `Categoria de capacidade | Horas | Evidência ou suposição | Notas`

Incluir: horas nominais, compromissos fixos, overhead operacional, execução focada, revisão/validação, reserva de contingência, total alocado. Nunca alocar 100% do nominal.

**Reserva de contingência: sempre 15% da capacidade de execução planejada**, declarando o percentual na própria linha da tabela (ex.: `Reserva de contingência | 5,1h (15%) | Padrão fixo da metodologia | ...`). Percentual diferente só é permitido se houver DECISION registrada em §3.2 (DEC-XX) com a fonte do pedido do cliente e o valor adotado — nunca como escolha livre da execução.

## 8. Plano de Frentes de Trabalho (Workstreams)

Tabela: `Frente | Resultado de julho/mês | Prioridade | Responsável | Stakeholders | Dependências | Capacidade alocada | Evidência de conclusão`

## 9. Plano Operacional Semanal

Cobrir cada semana do período coberto (dividir por semanas civis reais do calendário, não forçar 4 semanas fixas).

Para cada semana: `Semana | Resultado principal | Tarefas | Responsável | Dependência | Métrica | Evidência de conclusão | Gate`

Não preencher artificialmente fins de semana quando a evidência indicar modelo de dias úteis.

## 10. Registro Executável de Tarefas

Schema canônico: ver `references/schema-csv-tarefas.md` — 25 colunas (`tarefa_id`, `cluster_id`, `cluster_nome`, `titulo`, `verbo_acao`, `camada_operacional`, `resultado_esperado`, os 5 critérios SMART separados, `prompt_ia_self_contained`, `passos` [máx. 3], `concluido_quando`, `evidencia_conclusao`, `tags`, `tarefas_relacionadas`, `dependencia_bloqueante`, `responsavel`, `prioridade`, `prazo`, `tempo_estimado`, `status`, `fonte_id`). Esta seção usa as **25 colunas completas**, incluindo `fonte_id` (rastreio a FACT-XX/DECISION-XX/REQ-XX das seções 2-3) — é o único lugar do pacote onde esse campo aparece.

Pode ser apresentada nesta seção como tabela Markdown (para leitura humana) e/ou como bloco de dados CSV anexado (para consumo por agente/ferramenta), desde que as duas representações fiquem sincronizadas — a tabela Markdown não é uma versão simplificada com menos colunas, é a mesma tabela renderizada.

Toda tarefa: começa com verbo de ação (`titulo`); tem uma ação de abertura concreta e distinta do título (`camada_operacional`); produz entregável observável (`resultado_esperado`); cabe no modelo de capacidade (§7); tem prioridade baseada em evidência; nunca mais de 3 `passos`; `concluido_quando` é declarado antes da execução, nunca decidido durante; toda tarefa vinda de FACT/DECISION/REQ já registrado carrega o `fonte_id` correspondente — se vier de um GAP ainda não coberto, usar `TBD` e refletir o GAP em §3.4.

## 11. Visão Diária de Baixa Carga Cognitiva

Para cada dia útil ativo: `Data | Fluxo principal | Passo 1 | Passo 2 | Passo 3 | Entregável esperado | Bloco de tempo | Validação de fim de dia`

Não inventar trabalho para todo dia quando uma visão semanal ou por marco for mais apropriada.

## 12. Mapa de Stakeholders e Dependências

Tabela: `ID | Stakeholder ou dependência | Papel | Input necessário | Data necessária | Responsável pelo acompanhamento | Impacto se falhar`

## 13. Métricas e Cadência de Revisão

Tabela: `ID Métrica | Métrica | Fórmula | Fonte de dado | Frequência | Meta | Decisão acionada`

Nunca inventar baseline numérico. Quando ausente, usar: "Baseline não evidenciado — medir antes de confirmar meta."

## 14. Riscos e Controles

Tabela: `ID Risco | Risco | Evidência | Probabilidade | Impacto | Ação preventiva | Contingência | Responsável | Gatilho`

Usar probabilidade e impacto qualitativos, a menos que haja dado quantitativo confiável.

## 15. Itens Adiados e Excluídos

Tabela: `Item | Motivo do adiamento/exclusão | Evidência | Condição de reconsideração`

Adiar explicitamente: trabalho que excede a capacidade do mês, trabalho bloqueado por evidência ausente, trabalho dependente de decisão não aprovada, trabalho duplicado, trabalho não sustentado pelo objetivo atual.

## 16. Gates de Decisão

Tabela: `ID Gate | Decisão | Evidência necessária | Responsável pela decisão | Prazo | Consequência de não decidir`

## 17. Próxima Ação Imediata

Exatamente **uma** próxima ação, com: responsável, ação concreta, fonte, resultado esperado, duração máxima razoável, evidência de conclusão, "por que esta ação e não outra".

## Apêndice A — Tabela Mínima de Rastreabilidade

Obrigatória. Schema: `ID | Requisito | Fonte original | Citação da fonte | Classificação | Status de evidência | Dependência | Ação`

Deve cobrir todo REQ-XX relevante levantado no processamento — é a tabela auditável central do documento.

## Apêndice B — Referências Cruzadas Rápidas

Lista curta "onde procurar" (ex.: "Meta do mês → §6", "O que fazer hoje → §11 + §17", "Conflito de fontes → §3.5", etc.), adaptada às seções que efetivamente tiverem conteúdo.

## Registro Final de Honestidade

Fechar o documento com um parágrafo curto confirmando: todas as lacunas foram preservadas; nenhum baseline/meta foi inventado onde a fonte silenciou; não se afirma conformidade normativa; conflitos não foram silenciosamente resolvidos; "recomendação" foi usada onde apropriado, não "requisito". Terminar com "Fim do documento. Emitido em [data] às [hora local]."
