# Núcleo de dependências — contrato transversal do `executar-cop`

**Origem:** a parte portátil do prompt mestre `EXECUTAR-DEPENDENCY-ARCHITECT-001` (texto literal em `skills/executar-dependency-architect/references/prompt-mestre.yaml`).
**Vigência:** obrigatório em **toda** skill, command e agente do plugin (ADR-0003, decisão 3).
**Limite:** este núcleo não substitui o especialista. A leitura da planilha `EXECUTAR_HUB_Control_Plane_v2.xlsx`, o `16_REG_Dependencias` e a Arquitetura de Preenchimento continuam em `executar-dependency-architect`.

## 1. Modelo epistêmico (toda relação recebe uma tag)
| Tag | Significado | Exige |
|---|---|---|
| `DIRECT` | Dependência explicitamente documentada. | Citar a fonte (arquivo, aba, seção). |
| `DERIVED` | Dependência necessária, demonstrável por campos/artefatos. | Justificativa rastreável (qual campo ou artefato a torna necessária). |
| `PROPOSED` | Dependência recomendada, exigindo validação. | Justificativa + marcação "exige validação humana". |
| `CONFLICT` | Fontes ou relações incompatíveis. | Citar as duas fontes; não escolher sozinho. |
| `GAP` | Não há informação suficiente. | Declarar a lacuna; não preencher. |

## 2. Regras (valem sempre)
1. Não inventar dependência como fato. Na dúvida, usar `PROPOSED` ou `GAP`.
2. Toda `DERIVED` tem justificativa rastreável.
3. Preservar IDs canônicos. Não renomear nem alterar macroáreas, domínios, CV IDs ou IDs de tarefa.
4. Detectar dependências circulares. Um ciclo é bloqueio que precisa ser reportado, nunca contornado em silêncio.
5. Separar dependência **bloqueante** (`mandatory: true`) de **informativa** (`mandatory: false`).
6. Determinar o que deve existir primeiro.
7. Relacionar dependências a Gates quando aplicável. Gate desconhecido: `gate:tbd`.
8. Posição na árvore ou no diretório **não** é dependência. A dependência só existe se estiver declarada.
9. Bloqueio **interno** é trabalho do próprio sistema ainda não concluído. Bloqueio **externo** é terceiro, aprovação, plataforma ou recurso não instalado. Um bloqueio externo não trava os ramos independentes.

## 3. Princípio de agrupamento (quando houver sequência ou fases)
1. Dependência real de informação.
2. Continuidade de contexto cognitivo.
3. Macroárea e domínio.
4. Ordem dos Gates.

**Proibido** agrupar por dias, semanas, conveniência visual ou pela simples ordem numérica dos IDs.

- **Critério de fase:** cada fase é um único contexto cognitivo. Uma nova fase só começa com mudança material de contexto ou quando uma dependência bloqueante exige concluir o conjunto anterior.
- **Critério de saída:** declarar exatamente o que passa a estar disponível para a etapa seguinte e qual Gate pode ser avaliado.

## 4. Pré-voo de dependências (antes de agir)
Toda skill, command e agente executa o pré-voo **antes** de produzir o resultado principal, na medida do caso.

1. Listar as entradas de que a ação depende: dados, artefatos, decisões, skills, plugins, Gates.
2. Classificar cada entrada com a tag epistêmica (§1) e como bloqueante ou informativa.
3. Consultar `references/grafo-dependencias.json` quando a ação corresponder a um nó do plugin.
4. Decidir:
   - `prosseguir`: nenhuma entrada bloqueante pendente;
   - `bloqueado-interno`: falta trabalho do próprio sistema. Indicar o que precisa existir primeiro;
   - `bloqueado-externo`: falta recurso de terceiro ou não instalado. Seguir com os ramos independentes;
   - `perguntar`: há `CONFLICT` ou ambiguidade material. Pedir a decisão mínima.

**Ordem de comunicação:** declare o resultado do pré-voo **antes** de procurar ou pedir entradas. Se a ação depende de outra etapa (por exemplo, `/arvore` depende de `/dependencias` no fluxo proprietário), diga primeiro se ela pode rodar agora e por quê, citando o ID da dependência. Só depois peça ou procure o arquivo que falta. Uma entrada ausente não substitui a explicação da dependência.

**Formato proporcional:** quando não há dependência bloqueante, basta uma linha:
`Pré-voo: prosseguir — entradas: <X (DIRECT: fonte)>; Gate: <id|gate:tbd>.`

Quando houver bloqueio ou conflito, usar a tabela:

| Entrada | Origem | Tag | Bloqueante? | Gate | Situação |
|---|---|---|---|---|---|

## 5. Declaração de saída (depois de agir)
Fechar todo resultado relevante com:
`Dependências de entrada → Saída → Gate`, dizendo o que a saída **desbloqueia** (qual etapa, nó ou Gate pode ser avaliado a seguir) e onde está a evidência.

## 6. Formato de registro (compatível com `16_REG_Dependencias`)
Quando uma ação produzir ou alterar relações, registrar no schema exato:
`dependency_id, source_artifact_id, target_artifact_id, relation, mandatory, gate_id, required_status, status`.
A tag epistêmica e a justificativa vão em anexo, com a mesma `dependency_id`, e não como colunas extras do registro.
Semântica: `target` depende de `source`, ou seja, `source` deve existir primeiro.
