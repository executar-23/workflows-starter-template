# Formato de entrega — EXECUTAR-DEPENDENCY-ARCHITECT-001

A entrega tem sempre as três partes obrigatórias, nesta ordem, seguidas do anexo e do fechamento. Se alguma parte for impossível (por exemplo, sem planilha), mantenha o título da parte e declare o bloqueio no lugar do conteúdo.

---

## Pré-voo
`Pré-voo: <prosseguir|bloqueado-externo|…> — planilha <nome> (sha256 <12 primeiros>); abas obrigatórias ausentes: <lista|nenhuma>.`

## PARTE 1 — REGISTRO FORMAL DE DEPENDÊNCIAS
Linhas completas, prontas para inserção em `16_REG_Dependencias`, **somente com as 8 colunas do schema exato**, nesta ordem:

| dependency_id | source_artifact_id | target_artifact_id | relation | mandatory | gate_id | required_status | status |
|---|---|---|---|---|---|---|---|
| DEP-… | A.. | A.. | … | TRUE/FALSE | G-..\|gate:tbd | … | … |

- Leitura da linha: *target depende de source* (o source precisa existir primeiro).
- IDs existentes em 16_REG são reutilizados. Os novos seguem o padrão da planilha.
- Relações `GAP` não entram. Relações `CONFLICT` entram só se o usuário decidir, e até lá ficam no anexo.
- Grave dois arquivos:
  - `registro.csv`: o registro completo, incluindo as linhas já existentes que você reutilizou. É esse arquivo que passa pelo validador.
  - `registro_para_colar.csv`: **somente as linhas novas**, para o usuário não duplicar linhas já presentes no 16_REG.

  Informe o caminho dos dois.

## PARTE 2 — MAPA DE DEPENDÊNCIAS
Cadeia **origem → destino → motivo → Gate → impacto**, agrupada por Gate ou por macroárea:

| Origem | → Destino | Motivo (campo/fonte) | Gate | Impacto se faltar | Tag | Bloqueante? |
|---|---|---|---|---|---|---|

### Transição Produto → Engenharia (A03)
Subseção obrigatória com três pontos:
- o que o A03 recebe de Produto (campos e artefatos);
- o que entrega à Engenharia;
- qual Gate governa a passagem e o que acontece se ela for antecipada.

### Ciclos e como foram resolvidos
Liste cada ciclo encontrado e a resolução: qual aresta é informativa, ou a proposta de divisão marcada como `PROPOSED`.

### Camadas topológicas (bloqueantes)
Copie a saída do validador: camada 1 → camada N.

## PARTE 3 — ARQUITETURA DE PREENCHIMENTO
Colunas obrigatórias, nesta ordem:

| Fase | Contexto único | Escopo: macroáreas/domínios | Entregável 1 | Entregável 2 | Entregável 3 | Dependências de entrada | Saída da fase | Gate associado |
|---|---|---|---|---|---|---|---|---|

- Cada fase corresponde a um contexto cognitivo. A justificativa da fronteira aparece em uma linha abaixo da tabela: mudança de contexto ou bloqueante.
- A coluna "Saída da fase" diz exatamente o que fica disponível para a fase seguinte e qual Gate pode ser avaliado.
- Quando uma fase tiver mais de 3 entregáveis, liste os principais nas colunas e o restante em uma nota "Também nesta fase: …". A quantidade de colunas não muda.
- Cobertura: `campos cobertos N/total` (saída do validador com `--fases`).

## ANEXO — Proveniência epistêmica
| dependency_id | status_epistemico | justificativa / fonte |
|---|---|---|

## Lacunas e conflitos
- **GAP**, para 21_REG_Gaps: abas obrigatórias ausentes, domínios de valor não definidos, PF-24 sem definição e relações sem informação.
- **CONFLICT**, para 22_REG_Conflitos: as duas fontes e a decisão mínima que o usuário precisa tomar.
- **PROPOSED**: o que exige validação humana.

## Fechamento
`Dependências de entrada → Saída → Gate`:
- quais abas e registros alimentaram a análise;
- o que foi produzido (`registro.csv`, `anexo.csv`, `fases.json` e as três partes);
- o que isso desbloqueia: por exemplo, `estrutura.json` da `executar-arvore-roadmap` (CV-ARVORE-001) e a avaliação de Gates;
- o resultado do validador: erros 0 e a lista de avisos.
