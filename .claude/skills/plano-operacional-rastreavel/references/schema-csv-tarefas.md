# Schema do CSV de Tarefas (Registro Executável — formato canônico)

> Este arquivo é o schema canônico de dados por trás de duas peças do pacote de 4 entregáveis:
> a **Seção 10 (Registro Executável de Tarefas)** do documento interno (`schema-documento-interno.md`) e o
> **Entregável #3 — Schema de Importação para o Linear** (`schema-entregaveis-cliente.md` §B).
> As duas peças derivam da mesma tabela de dados; o que muda entre elas é **quais colunas são expostas** (ver §"Uso por entregável" abaixo), nunca o significado dos campos.

Uma linha = uma tarefa. 22 colunas obrigatórias/recomendadas, nesta ordem exata, mais 3 colunas adicionais de rastreabilidade. Cabeçalho na primeira linha, em snake_case, exatamente como listado abaixo (para compatibilidade com importação em outras ferramentas).

O prefixo de ID usado (`TSK-NNNN`) é o mesmo prefixo `TSK` já definido em `motor-evidencia-fontes.md`. Os campos `camada_operacional`, `passos` (máx. 3), `concluido_quando` e `evidencia_conclusao` seguem o mesmo vocabulário canônico de tarefa (AGORA / PASSOS / CONCLUÍDO QUANDO / EVIDÊNCIA) já usado em outros artefatos do ecossistema — não são um vocabulário novo desta skill, é o mesmo padrão aplicado de forma consistente.

## Colunas

| # | Coluna | Tipo | Obrigatório | Descrição |
|---|---|---|---|---|
| 1 | `tarefa_id` | string | sim | ID estável, formato `TSK-NNNN` (4 dígitos, zero à esquerda). Nunca reutilizar um ID já usado, mesmo que a tarefa seja excluída depois. |
| 2 | `cluster_id` | string | sim | ID do agrupamento temático, formato `CLU-NN`. Várias tarefas compartilham o mesmo cluster. |
| 3 | `cluster_nome` | string | sim | Nome curto e legível do cluster (ex: "Preparação do lançamento", "Conteúdo editorial") — repetido em toda linha do mesmo cluster para facilitar filtro/leitura sem precisar de tabela auxiliar. |
| 4 | `titulo` | string | sim | Verbo de ação + objeto específico + resultado ou limite. Ex: "Exportar o protótipo A4 em PDF para impressão". Nunca um substantivo solto ("Revisão do X"). |
| 5 | `verbo_acao` | string | sim | O verbo isolado, no infinitivo, normalizado em minúsculas (ex: "exportar"). Usado para agregação/analytics. |
| 6 | `camada_operacional` | string | sim | A ação concreta de abertura ("AGORA"): a primeira coisa física ou digital que a pessoa faz para começar. Nunca idêntica ao título. Ex: "Abrir a versão aprovada do protótipo no navegador." |
| 7 | `resultado_esperado` | string | sim | O que deve existir ao final, de forma observável. Ex: "Um PDF em escala real, sem marcas de corte visíveis." |
| 8 | `criterio_smart_especifico` | string | sim | O recorte exato desta tarefa — o que ela cobre e o que não cobre. |
| 9 | `criterio_smart_mensuravel` | string | sim | Como medir ou verificar que foi feita — número, checklist, ou condição binária. |
| 10 | `criterio_smart_atingivel` | string | sim | Por que é exequível dentro da capacidade/tempo declarados (ou `TBD` se a capacidade não foi informada). |
| 11 | `criterio_smart_relevante` | string | sim | Por que essa tarefa importa para o objetivo/cluster maior. |
| 12 | `criterio_smart_temporal` | string | sim | Prazo ou bloco de tempo em que deve ocorrer. Usar `TBD` se ainda não definido — nunca inventar data. |
| 13 | `prompt_ia_self_contained` | string | sim | Prompt XML-like completo, pronto para ser executado isoladamente por qualquer IA. Estrutura obrigatória definida em `prompt-self-contained.md`. **Coluna mandatória em toda tarefa, no Registro interno e no entregável #3 — sem exceção condicional.** |
| 14 | `passos` | string | sim | No máximo 3 passos, separados por `\|`. Cada passo começa com verbo de ação. |
| 15 | `concluido_quando` | string | sim | Condição observável e verificável de conclusão — declarada antes da execução, não decidida durante. |
| 16 | `evidencia_conclusao` | string | sim | Como a conclusão será comprovada (arquivo, link, print, checklist preenchido, registro). |
| 17 | `tags` | string | sim | 2 a 5 tags curtas, minúsculas, sem espaço (usar `-` para termos compostos), separadas por `\|`. |
| 18 | `tarefas_relacionadas` | string | não | Lista de `tarefa_id` do mesmo cluster que compõem o mesmo fluxo de trabalho inteligente, separados por `\|`. Vazio se a tarefa for autônoma. |
| 19 | `dependencia_bloqueante` | string | não | Um único `tarefa_id` que precisa estar concluído antes desta começar. Vazio se não houver bloqueio. Nunca apontar para o próprio `tarefa_id`. |
| 20 | `responsavel` | string | não | Nome ou papel responsável. `TBD` se ainda não definido. |
| 21 | `prioridade` | enum | sim | Um de: `Alta`, `Média`, `Baixa`. Nunca "P0/P1/P2" (jargão interno). |
| 22 | `prazo` | date | não | Formato `DD/MM/AAAA`. `TBD` se não houver prazo definido. |

Colunas adicionais (23-25), **apenas no Registro interno (§10 do documento #1)** — nunca no entregável ao cliente (ver §"Uso por entregável"):

| # | Coluna | Tipo | Obrigatório | Descrição |
|---|---|---|---|---|
| 23 | `tempo_estimado` | string | recomendado | Bloco previsto de execução (ex: "45 minutos", "2 blocos de 90 min"). |
| 24 | `status` | enum | sim | Um de: `Não iniciada`, `Em andamento`, `Declarada como concluída — não verificada`, `Concluída e verificada`, `Não pronta para execução`, `Bloqueada`. |
| 25 | `fonte_id` | string | não | ID de rastreio à fonte no plano de origem (ex: `FACT-03`, `DECISION-12`, `REQ-07` de um plano gerado pelo `plano-operacional-rastreavel`, ou `TBD` se não vier de um plano formal). |

## Uso por entregável

- **Registro Executável de Tarefas (documento interno #1, §10):** usar as **25 colunas**. `fonte_id` é obrigatório sempre que a tarefa derivar de um FACT/DECISION/REQ já registrado nas seções 2-3 do documento; usar `TBD` só quando a tarefa vier de um GAP ainda não coberto por fonte.
- **Entregável #3 (Linear import, cliente final):** usar as **colunas 1-22, incluindo a 13 (`prompt_ia_self_contained`), que é mandatória em ambos os entregáveis** — decisão fixa da metodologia (DEC-09), não mais condicional ao perfil do cliente. Nunca incluir `fonte_id` (coluna 25 — é ID interno de rastreabilidade, proibido em entregável de cliente, mesma regra já aplicada a `SRC-XX`/`CONF-XX`). `tempo_estimado` e `status` (23-24) podem ser incluídos **somente se o cliente/usuário operar o próprio fluxo com esse vocabulário de status** — na dúvida, omitir e usar a coluna 21 (`prioridade`) e 22 (`prazo`) como suficientes para o cliente.
- **Decisão fixa (DEC-09):** a coluna 13 deixou de ser um ponto em aberto. Toda tarefa, em qualquer entregável, carrega um prompt self-contained completo — mesmo em contextos onde o cliente não opera diretamente via agente de IA, o prompt serve como especificação executável não-ambígua da tarefa (útil também para quem executa manualmente). A estrutura obrigatória está fixada em `prompt-self-contained.md`.

## Regras de preenchimento

- **Nunca deixar célula obrigatória vazia.** Se a informação não existir, usar literalmente `TBD` — nunca inventar valor plausível para preencher.
- **`titulo` e `camada_operacional` nunca são idênticos.** O título é o "o quê"; a camada operacional é o "por onde começo agora".
- **`passos` no máximo 3.** Se a tarefa parecer precisar de mais de 3 passos, ela provavelmente deveria ser dividida em mais de uma tarefa dentro do mesmo cluster.
- **`tarefas_relacionadas` é sobre eficiência de execução, não similaridade temática.** Só relacionar tarefas que genuinamente ganham por serem feitas juntas ou em sequência no mesmo bloco de atenção (mesmo arquivo, mesma ferramenta, mesmo contexto mental) — não apenas tarefas do mesmo assunto geral.
- **Escapar corretamente vírgulas e quebras de linha** dentro de células (usar aspas duplas ao redor do valor, conforme padrão CSV RFC 4180).
- **IDs nunca são reaproveitados.** Se uma tarefa for removida do plano, seu `tarefa_id` fica "queimado" — a próxima tarefa nova recebe o próximo número da sequência.

## Exemplo de uma linha (ilustrativo, campos truncados para leitura)

```
tarefa_id: TSK-0001
cluster_id: CLU-01
cluster_nome: Preparação do lançamento
titulo: Exportar o protótipo A4 em PDF para impressão
verbo_acao: exportar
camada_operacional: Abrir a versão aprovada do protótipo no navegador.
resultado_esperado: Um PDF em escala real, sem marcas de corte visíveis.
criterio_smart_especifico: Cobre só a exportação e teste de impressão, não o design do protótipo.
criterio_smart_mensuravel: PDF exportado + cópia impressa dobrável sem cortar conteúdo.
criterio_smart_atingivel: Cabe em um bloco de 45 min dentro da capacidade semanal declarada.
criterio_smart_relevante: Necessário para validar o formato físico antes da produção em lote.
criterio_smart_temporal: Até sexta-feira desta semana.
prompt_ia_self_contained: "<tarefa id=\"TSK-0001\">...</tarefa>" (XML completo — ver exemplo aplicado em prompt-self-contained.md)
passos: Conferir as três áreas de dobra.|Exportar em A4, escala 100%.|Imprimir uma cópia de teste.
concluido_quando: A cópia estiver impressa e as três áreas dobrarem sem cortar conteúdo.
evidencia_conclusao: PDF exportado + foto da cópia dobrada.
tags: protótipo|impressão|lançamento
tarefas_relacionadas: TSK-0002|TSK-0003
dependencia_bloqueante: (vazio)
responsavel: TBD
prioridade: Alta
prazo: 25/07/2026
tempo_estimado: 45 minutos
status: Não iniciada
fonte_id: TBD
```
