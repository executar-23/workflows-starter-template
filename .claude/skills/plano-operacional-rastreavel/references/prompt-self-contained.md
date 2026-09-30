# Estrutura Obrigatória do Prompt IA Self-Contained

> Referenciado pela coluna 13 (`prompt_ia_self_contained`) de `schema-csv-tarefas.md`. É de preenchimento **mandatório** em toda tarefa, tanto no Registro interno (§10) quanto no entregável #3 (Linear import) — não é mais uma coluna condicional.

## O que "self-contained" significa aqui

Um prompt self-contained é aquele que **qualquer IA, em qualquer sessão, sem acesso a esta conversa, ao documento interno ou ao histórico do cliente**, consegue executar a tarefa corretamente só de ler o conteúdo da célula. Isso significa:

- Nunca referenciar "conforme discutido acima", "o documento interno", "a seção 6", ou qualquer contexto fora da própria célula.
- Todo dado necessário (objetivo, restrição, formato de saída, critério de conclusão) é repetido dentro do próprio prompt, mesmo que já exista em outra coluna da mesma linha — redundância aqui é correta, não é duplicação a evitar.
- Se um dado necessário para a IA executar a tarefa não existir (`TBD` em alguma célula da linha), o prompt declara isso explicitamente como lacuna em vez de a IA executante ter que adivinhar.

## Estrutura XML-like obrigatória

```xml
<tarefa id="TSK-NNNN">
  <contexto>
    Uma ou duas frases com o mínimo de contexto de negócio/projeto necessário
    para a tarefa fazer sentido isoladamente (nome do projeto/cliente, cluster,
    e por que essa tarefa existe). Nunca pressupor que quem lê já sabe disso.
  </contexto>

  <objetivo>
    O mesmo conteúdo de `resultado_esperado` (coluna 7), reformulado como
    instrução direta de execução ("Produza X" / "Gere Y" / "Confirme Z").
  </objetivo>

  <entrada>
    O que a IA executante recebe ou tem acesso para realizar a tarefa
    (arquivo, dado, contexto prévio). Se nada além do próprio prompt for
    necessário, declarar explicitamente: "Nenhuma entrada externa requerida
    além deste prompt."
  </entrada>

  <restricoes>
    Limites que não podem ser violados durante a execução — formato,
    escopo, o que NÃO fazer, dependências bloqueantes (coluna 19), e
    quaisquer guardrails do projeto (ex.: não prometer diagnóstico/cura,
    não inventar dado ausente, usar `TBD` em vez de valor inventado).
  </restricoes>

  <passos>
    Repetir literalmente o conteúdo da coluna 14 (`passos`, máx. 3),
    um por linha, cada um começando com verbo de ação.
  </passos>

  <criterio_de_conclusao>
    O mesmo conteúdo de `concluido_quando` (coluna 15) — condição
    observável e verificável, declarada aqui de novo para que a IA
    executante saiba quando parar.
  </criterio_de_conclusao>

  <formato_de_saida>
    Tipo de artefato esperado (arquivo, texto, tabela, decisão registrada)
    e onde/como deve ser entregue.
  </formato_de_saida>

  <evidencia_esperada>
    O mesmo conteúdo de `evidencia_conclusao` (coluna 16) — como a
    conclusão será comprovada.
  </evidencia_esperada>

  <lacunas_conhecidas>
    Opcional. Listar qualquer célula `TBD` da linha que a IA executante
    precise saber que está em aberto, para não inventar um valor no lugar.
    Omitir esta tag inteira se não houver nenhuma lacuna na linha.
  </lacunas_conhecidas>
</tarefa>
```

## Regras de preenchimento

- Todas as tags são obrigatórias, **exceto** `<lacunas_conhecidas>`, que só aparece se houver `TBD` na linha.
- Nunca deixar uma tag vazia — se o conteúdo correspondente da linha for `TBD`, escrever `TBD` dentro da tag também (nunca omitir a tag nem inventar conteúdo).
- O prompt inteiro deve caber em uma única célula CSV — escapar quebras de linha internas conforme RFC 4180 (aspas duplas ao redor do valor).
- Se a tarefa tiver `dependencia_bloqueante` (coluna 19) preenchida, ela **deve** aparecer em `<restricoes>` como condição de bloqueio, não só na coluna separada.
- Este template é a estrutura mínima obrigatória — tags adicionais podem ser incluídas quando a tarefa exigir (ex.: `<ferramentas_disponiveis>` para tarefas que dependem de MCP/skills específicas), mas as 7 tags obrigatórias acima nunca podem ser removidas.

## Exemplo aplicado (mesma tarefa do exemplo em `schema-csv-tarefas.md`)

```xml
<tarefa id="TSK-0001">
  <contexto>
    Preparação do lançamento (cluster CLU-01). O protótipo A4 já foi aprovado
    e precisa ser testado em papel real antes da produção em lote.
  </contexto>
  <objetivo>
    Produzir um PDF em escala real (100%), sem marcas de corte visíveis,
    a partir da versão aprovada do protótipo.
  </objetivo>
  <entrada>
    Nenhuma entrada externa requerida além deste prompt e do arquivo do
    protótipo já aprovado (acessível pelo executor humano/agente).
  </entrada>
  <restricoes>
    Escala deve ser exatamente 100% (nunca "ajustar à página"). Não alterar
    o design do protótipo nesta tarefa — só exportar e testar impressão.
  </restricoes>
  <passos>
    Conferir as três áreas de dobra.
    Exportar em A4, escala 100%.
    Imprimir uma cópia de teste.
  </passos>
  <criterio_de_conclusao>
    A cópia estiver impressa e as três áreas dobrarem sem cortar conteúdo.
  </criterio_de_conclusao>
  <formato_de_saida>
    Um arquivo PDF salvo + uma cópia física impressa e dobrada.
  </formato_de_saida>
  <evidencia_esperada>
    PDF exportado + foto da cópia dobrada.
  </evidencia_esperada>
</tarefa>
```
