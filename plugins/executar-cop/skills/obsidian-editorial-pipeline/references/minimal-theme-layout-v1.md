# Integração com o tema Minimal

## Princípio

Produzir Markdown funcional no Obsidian padrão. Tratar o tema Minimal, de kepano, como aprimoramento opcional de apresentação. Não tornar o conteúdo dependente de tema ou plugin.

A captura fornecida pelo usuário mostra Minimal 8.2.2. Não fixar a skill nessa versão: confirmar classes na documentação do repositório quando uma atualização puder alterar o comportamento.

Usar a propriedade canônica atual `cssclasses` em minúsculas. Adicionar classes apenas quando o modificador correspondente estiver ativo.

## Classes úteis do Minimal

### Largura

- Tabela: `table-100`, `table-max`, `table-wide`.
- Imagem: `img-100`, `img-max`, `img-wide`.
- Iframe: `iframe-100`, `iframe-max`, `iframe-wide`.

Escolher a menor largura que resolva o conteúdo. Evitar `wide` no mobile salvo necessidade real.

### Tabelas

- Quebra: `table-wrap` ou `table-nowrap`.
- Números: `table-numbers`, `table-tabular`.
- Escala: `table-small`, `table-tiny`.
- Linhas: `table-lines`, `row-lines`, `col-lines`.
- Alternância: `row-alt`, `col-alt`.

Para `OBS-LAYOUT-TABLE`, usar por padrão:

```yaml
cssclasses:
  - table-wrap
  - table-lines
  - row-lines
  - table-small
```

Remover classes que não tenham efeito no documento.

### Imagens

Usar `img-grid` somente com `OBS-LAYOUT-IMAGES` e quando existirem imagens relevantes. Não criar imagens decorativas automaticamente.

### Cartões

As classes `cards`, `cards-align-bottom`, `cards-cover`, proporções `cards-16-9`, `cards-1-1`, `cards-2-1`, `cards-2-3` e colunas `cards-cols-1` a `cards-cols-8` são voltadas a tabelas produzidas por Dataview.

Usar somente quando:

1. o comando contém `OBS-LAYOUT-CARDS`;
2. o usuário confirma que Dataview está instalado;
3. cartões melhoram a navegação;
4. existe alternativa nativa ou aviso claro de dependência.

### Outros recursos

- `embed-strict` restringe o estilo de conteúdo incorporado.
- `img-grid` cria grade de imagens.
- Checkboxes alternativos do Minimal são opcionais; usar `- [ ]` e `- [x]` como padrão nativo.

## Configuração visual recomendada

- Foco e largura de linha controlada.
- Bordas discretas ou ocultas.
- Títulos monocromáticos.
- Vermelho (`#e31919`, token do calendário) apenas como acento funcional: hoje, prioridade alta, item atual.
- Hider e Minimal Theme Settings podem melhorar a experiência, mas não são requisitos.
- Style Settings é opcional.

## Combinação com DESK-OS

Com `OBS-LAYOUT-DESK`, adicionar:

```yaml
cssclasses:
  - obsidian-editorial
```

Entregar também `assets/obsidian-editorial.css` quando o usuário solicitar o snippet. O Markdown continua funcional sem ele.
