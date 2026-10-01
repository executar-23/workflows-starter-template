# 04 · Integração com Obsidian

## Princípio

No Obsidian, cada pasta ou nota pode corresponder a um nó da Árvore Visual.

A estrutura física de arquivos não precisa reproduzir todo o grafo de dependências. As relações cruzadas entram por propriedades e ligações internas.

## Exemplo

```text
LANCAMENTO-0709/
├── 00-ABRA-AQUI.md
├── 25-08/
│   ├── 00-DIA.md
│   ├── ROTAS.md
│   ├── CHAMADAS.md
│   └── MATERIAIS.md
└── 26-08/
    └── 00-DIA.md
```

Em `25-08/00-DIA.md`:

```yaml
---
id: D25
estado: atual
depende_de: []
desbloqueia:
  - D26
---
```

## Mergulho

A navegação recomendada é:

```text
[[00-ABRA-AQUI]]
  ↓
[[25-08/00-DIA]]
  ↓
[[25-08/ROTAS]]
```

A pessoa entra pelo nível atual e aprofunda somente quando precisa.

## Regra de ligação

Use `[[wikilinks]]` apenas para notas que realmente existem.

Para dependências cruzadas, prefira propriedades explícitas:

```yaml
depende_de:
  - D25-ROTAS
  - D25-CTAS
```

A pasta informa **onde está**.

A propriedade informa **do que depende**.

## Compatibilidade com Executar · Mergulhe

A habilidade `executar-mergulhe` incluída neste pacote gera:

- árvore de pastas;
- notas de entrada;
- relações internas;
- nós de dependência;
- portas;
- índice de navegação;
- representação compatível com a Árvore Visual.
