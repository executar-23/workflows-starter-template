# Workflow Composer

## Quando usar

Use quando cada item exigir raciocínio, pesquisa, navegação ou exploração independente e uma destas condições for verdadeira:

- há 3 ou mais itens independentes processáveis em paralelo;
- é necessário pesquisar, comparar, resumir ou analisar várias entidades com a mesma estrutura;
- os resultados formarão tabela, relatório, ranking, dataset ou outro entregável combinado;
- a execução exige loops, condições, tentativas, estágios ou grande fan-out.

Não use quando um único script determinístico puder percorrer os itens.

## Contrato de decomposição

1. Use exatamente um `agent()` por item independente.
2. O agente principal deve orquestrar, não pesquisar cada item.
3. Cada subagente recebe um prompt autocontido.
4. Agentes comparáveis compartilham o mesmo JSON Schema.
5. Agentes de itens executam dentro de um único grupo `parallel`.
6. Falhas individuais não devem invalidar resultados bem-sucedidos.

## Map/Reduce

Quando houver síntese entre itens:

1. **Map:** um agente por item em `parallel`.
2. **Collect:** preserve sucessos e registre falhas.
3. **Reduce:** use exatamente um agente redutor quando a síntese exigir julgamento.
4. **Return:** devolva síntese, resultados úteis e arquivos.

Se código determinístico puder combinar os resultados, dispense o redutor.

## Descoberta do conjunto de itens

- Lista fornecida pelo usuário → use diretamente.
- Lista derivável de conhecimento estável → defina critérios claros.
- Lista que exige pesquisa → execute um agente de descoberta com schema e depois faça fan-out.

Conte descoberta e redutor nos limites de chamadas.

## Modelo de execução

O script de workflow deve ser determinístico:

- sem filesystem, rede, timers ou `require`/`import`;
- sem `Math.random()` ou `Date`;
- com JavaScript comum, arrays, JSON e `async/await`;
- contendo apenas um corpo de função JavaScript válido.

## Primitivas

### `agent(prompt, options)`

Opções relevantes:

- `brief` — obrigatório; título claro da subtarefa;
- `schema` — JSON Schema da saída;
- `input_files` — arquivos explicitamente transferidos;
- `sandbox` — `shared` ou `isolated`;
- `effort_level` — `lite`, `standard` ou `max`.

### `parallel(brief, factory, {schema}?)`

Executa concorrentemente os agentes retornados por `factory`.

`factory` deve ser uma função que retorna um array de Promises de `agent()`.

### `log(message)`

Publica progresso conciso.

## Resultados estruturados

Para grupos comparáveis, use um JSON Schema compartilhado.

Resultados válidos já chegam decodificados. Não aplique `JSON.parse()` a resultados protegidos por schema.

## Arquivos

Campos de arquivo devem ser declarados como:

```javascript
{ type: "file" }
```

Um caminho declarado apenas como `string` é tratado como texto e não promove o arquivo ao resultado.

## Orçamento

- `effort_level`: `lite`, `standard`, `max`;
- `max_agent_calls`: limite superior;
- `estimated_agent_calls`: estimativa conservadora das chamadas reais.

Conte descoberta, itens, redutor e validação.

## Política de falhas

Prefira `collect` em fan-out por item.

Preserve resultados bem-sucedidos e registre falhas com `code` e `message`.

Use `fail_fast` apenas quando qualquer falha tornar o restante inválido.

## Confirmação

Workflows estimados em até 20 chamadas podem iniciar automaticamente.

Acima de 20 chamadas, aguarde confirmação explícita do usuário antes de aprovar a execução.

Não registre novamente o mesmo workflow pendente.
