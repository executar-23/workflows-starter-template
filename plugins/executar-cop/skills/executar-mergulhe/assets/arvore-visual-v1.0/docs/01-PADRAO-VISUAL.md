# 01 · Padrão Visual

## Nome canônico

**Executar · Árvore Visual**

## Metáfora

A interface usa a metáfora de arquivos e pastas.

- `📁` ramo fechado;
- `📂` ramo aberto;
- `📄` nó final;
- `🔒` porta não liberada;
- `🔓` porta liberada;
- etiquetas informam estado sem substituir o título.

## Hierarquia

```text
RAIZ
└── RAMO
    └── SUBRAMO
        └── NÓ
            └── AÇÃO / EVIDÊNCIA
```

A interface deve permitir profundidade sem obrigar o usuário a visualizar todos os níveis ao mesmo tempo.

## Estados visuais

| Estado | Uso |
|---|---|
| Atual | ponto de execução ou navegação presente |
| Liberado | pode ser executado ou consultado |
| Dependência | exige condição ou predecessor |
| Futuro | existe no plano, mas ainda não é o foco |

## Portas

Uma porta é um nó que controla transição de estado.

Exemplos:

- liberar o próximo dia;
- autorizar publicação;
- concluir revisão;
- abrir lançamento;
- permitir entrega ao cliente.

A porta nunca deve parecer uma simples tarefa quando sua função real é condicionar outros ramos.

## Interação mínima

Cada ramo precisa aceitar:

- abrir;
- fechar;
- abrir tudo;
- fechar tudo;
- ir para o estado atual.

Opcionalmente:

- abrir por ligação direta;
- destacar caminho atual;
- mostrar quantidade de descendentes;
- indicar bloqueios;
- indicar progresso agregado.

## Princípio de densidade

A informação deve ser progressiva.

**Não mostrar toda a complexidade por padrão.**

O primeiro quadro deve expor apenas os ramos principais. A profundidade aparece por ação explícita do usuário.

## Linguagem

Títulos curtos, concretos e orientados a objeto ou ação.

Preferir:

- `25/08 · Destinos de conversão`
- `Peça editorial 01`
- `Publicar e agendar`

Evitar:

- frases explicativas longas como título;
- jargão técnico quando não for necessário;
- rótulos que não mudem uma decisão.

## Acessibilidade

- controles devem ser botões reais;
- abertura e fechamento devem expor `aria-expanded`;
- foco de teclado deve ser visível;
- estado não deve depender somente de cor;
- toque deve funcionar sem depender de passar o cursor;
- títulos longos devem continuar legíveis em telas pequenas.
