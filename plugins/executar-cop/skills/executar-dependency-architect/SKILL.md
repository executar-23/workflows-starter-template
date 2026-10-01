---
name: executar-dependency-architect
description: >
  Arquiteto de Dependências do EXECUTAR HUB (EXECUTAR-DEPENDENCY-ARCHITECT-001, ID verbal CV-DEPEND-001, /dependencias).
  Reconstrói formalmente a rede de dependências da planilha EXECUTAR_HUB_Control_Plane_v2.xlsx —
  campo → artefato → domínio → macroárea → Gate — e entrega, sempre em três partes, as linhas prontas
  para 16_REG_Dependencias, o mapa origem → destino → motivo → Gate → impacto e a Arquitetura de
  Preenchimento (fases por contexto cognitivo único, derivadas das dependências reais). Use sempre que o
  usuário falar em Control Plane, EXECUTAR HUB, 16_REG_Dependencias, 17_REG_Gates, ordem ou sequência de
  preenchimento da planilha, os 1.125 campos, formulários A00–A12, transição Produto → Engenharia (A03),
  PF-24/reconciliação cruzada, depends_on/blocks, "qual artefato vem primeiro", dependências circulares
  entre entregáveis ou desenho de Gates — mesmo que não diga "dependência" nem use o slash.
---

# Arquiteto de Dependências do EXECUTAR HUB

A fonte literal deste especialista é `references/prompt-mestre.yaml` (EXECUTAR-DEPENDENCY-ARCHITECT-001). Leia esse arquivo na primeira execução. Ele define a missão, o princípio de agrupamento, o modelo epistêmico, o schema exato do registro, as regras, a entrega obrigatória e os critérios de fase e de saída. Este SKILL.md diz **como** cumprir o contrato; o que ele exige continua sendo o que está no YAML.

A planilha só deve ser preenchida depois que a lógica de dependências estiver reconstruída. Por isso, as fases são **consequência** das dependências reais. Elas nunca seguem a ordem numérica A00–A12/D01–D23 nem o calendário. Agrupar por conveniência gera retrabalho: um campo preenchido cedo demais, antes do artefato que o alimenta, precisa ser refeito.

## Integração executar-cop
- **ID verbal:** CV-DEPEND-001 (`/dependencias`), nó `DEPENDENCY-ARCHITECT` em `../../references/grafo-dependencias.json`. É upstream de `executar-arvore-roadmap` no fluxo PEM-PIPELINE-PROPRIETARIO. A Arquitetura de Preenchimento pode alimentar o `estrutura.json` dessa skill.
- **Pré-voo de dependências:** aplicar `../../references/nucleo-dependencias.md`. Esta skill é a forma completa do núcleo: o que ali vale para qualquer ação, aqui vale com a planilha inteira.
- **Busca web:** obrigatória antes de fechar a análise quando ela depender de referência externa, como padrões de gestão de programas, desenho de Gates ou normas citadas nas abas. Cite a fonte. A estrutura da planilha nunca vem da web.
- **Saída visual:** esta skill entrega tabelas. Se o usuário pedir o mapa em HTML ou SVG, aplicar `../../assets/design-tokens/calendario-light-mode.md`.
- Toda resposta sai em português do Brasil.

## Fluxo

### 1. Pré-voo: a planilha existe?
Sem o `.xlsx`, a análise fica **bloqueado-externo**. Peça o arquivo e não reconstrua dependências de memória nem de descrições soltas: seria inventar dependência como fato. Se o usuário quiser mesmo assim uma prévia, marque tudo como `PROPOSED` ou `GAP` e diga isso claramente.

### 2. Extrair (determinístico)
```bash
python3 scripts/extrair_control_plane.py <planilha.xlsx> <trabalho>/control_plane.json
```
O script lê todas as abas, sem interpretar nada, e lista as abas de leitura obrigatória que estiverem ausentes. Cada ausência é um `GAP` a declarar na entrega. Não substitua a aba ausente por suposição.

### 3. Ler integralmente antes de propor sequência
Percorra o JSON por inteiro: Leia-me, formulários, visões, registros 10 a 24 e o README do Master Index. Monte a cadeia de cada campo:

**campo** (15_REG_Campos) → **artefato** (14_REG_Artefatos) → **domínio** (11_REG_Dominios) → **macroárea** (10_REG_Macroareas) → **Gate** (17_REG_Gates)

As dependências entre artefatos aparecem quando um campo do artefato X **precisa de informação produzida** por um campo do artefato Y. Procure por colunas de consumo ou referência, pelas perguntas dos formulários, por trechos de documentos (19), decisões (20), linhas já existentes em 16_REG e artefatos exigidos por Gate.

### 4. Classificar cada relação
Use o modelo epistêmico do prompt:
- `DIRECT`: a relação está escrita em alguma fonte (16_REG, documento, decisão, Leia-me). Cite a aba e a linha.
- `DERIVED`: a relação é necessária e demonstrável por campo ou artefato. A justificativa diz qual campo consome qual.
- `PROPOSED`: recomendação sua. Registre a justificativa e marque que exige validação humana.
- `CONFLICT`: duas fontes se contradizem. Cite as duas, não escolha sozinho e registre para 22_REG_Conflitos.
- `GAP`: não há informação suficiente. Registre para 21_REG_Gaps. GAP não vira linha do registro.

Decida também se a relação é **bloqueante** (`mandatory` verdadeiro: o target não pode ser preenchido sem o source) ou **informativa** (contexto útil, mas não impeditivo).

### 5. Casos que sempre exigem atenção
- **A03 = transição Produto → Engenharia.** Analise explicitamente o que o A03 recebe de Produto, o que ele entrega à Engenharia e qual Gate governa essa passagem. Dedique uma subseção a isso no mapa.
- **Ciclos.** Um ciclo entre artefatos quase sempre mistura bloqueante e informativa. Resolva mostrando qual lado é informativo, ou proponha `PROPOSED` a divisão do campo. Nunca apague uma aresta em silêncio.
- **IDs canônicos.** Não altere IDs de artefato, campo, Gate, macroárea ou domínio. Reutilize `dependency_id` existentes em 16_REG para a mesma relação e crie IDs novos seguindo o padrão já usado.
- **Domínio de valores.** `relation`, `required_status` e `status` seguem os valores já usados em 16_REG ou definidos no Leia-me. Se não houver domínio definido, use um valor coerente e registre a escolha como `GAP` para decisão humana.

### 6. Validar (determinístico)
Grave três arquivos:
- o registro completo (`registro.csv`, com as 8 colunas exatas);
- o `registro_para_colar.csv`, só com as linhas novas;
- o anexo epistêmico (`dependency_id, status_epistemico, justificativa`).

Depois rode:
```bash
python3 scripts/validar_registro.py --registro <trabalho>/registro.csv --anexo <trabalho>/anexo.csv \
    --control-plane <trabalho>/control_plane.json [--fases <trabalho>/fases.json]
```
O script verifica:
- o schema exato;
- IDs e Gates existentes;
- preservação de IDs;
- ciclos bloqueantes;
- justificativa das DERIVED e PROPOSED.

Ele também imprime as **camadas topológicas**, isto é, o que precisa existir primeiro. Corrija todos os erros antes de entregar. Os avisos vão para a entrega como pendências.

### 7. Desenhar a Arquitetura de Preenchimento
Parta das camadas topológicas e agrupe pelo princípio de agrupamento: informação, depois contexto cognitivo, depois macroárea e domínio, depois Gates.
- **Fase:** um único contexto cognitivo. Uma nova fase só começa com mudança material de contexto ou quando um bloqueante exige concluir o conjunto anterior.
- **Saída da fase:** o que passa a estar disponível para a fase seguinte e qual Gate pode ser avaliado.

Grave `fases.json` (`[{"fase": "F1", "artefatos": [...]}]`) e rode o validador com `--fases`. Ele confere se:
- cada artefato está em exatamente uma fase;
- nenhuma fase vem antes de uma dependência bloqueante;
- a cobertura de campos está completa (N/total).

### 8. Entregar
Siga `references/formato-entrega.md`: as três partes obrigatórias, o anexo epistêmico, as lacunas e conflitos, e o fechamento `Dependências de entrada → Saída → Gate`. Informe a cobertura de campos e o resultado do validador.

## PF-24 (reconciliação cruzada)
Este especialista transforma a reconciliação cruzada em engenharia formal de dependências: em vez de só preencher `depends_on/blocks`, ele produz o registro, o mapa e as fases. A definição original do PF-24 não foi fornecida junto com o prompt mestre. Se a planilha ou o usuário a trouxerem, leia e alinhe; caso contrário, declare como `GAP`.
