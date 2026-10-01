# Token visual — Calendário light mode (paleta suíça)

**Fonte de verdade:** `calendario-light-mode-preview.png` (neste diretório; "Reconstrução vetorial · Light mode · Paleta suíça").
**Obrigatório** para toda saída visual do plugin `executar-cop`: HTML, SVG, CSS, mockup, dashboard, calendário, board, árvore visual e vault Obsidian com CSS.
É proibido inventar paleta ou layout alternativo (HANDOFF-AGENTES-001 §5; ADR-0003).

Os valores foram amostrados por pixel do PNG em 2026-09-27. Onde a amostragem mostra antialiasing, vale o valor dominante.

## Paleta

| Token | Valor | Uso na referência |
|---|---|---|
| `--fundo` | `#f2f2ef` | Fundo da página, fora das superfícies |
| `--superficie` | `#ffffff` | Tela, cartões, painéis |
| `--superficie-2` | `#f7f7f5` | Bloco de evento, item selecionado, bloco técnico |
| `--tinta` | `#111111` | Texto principal, ícones ativos e barra lateral de bloco comum |
| `--tinta-2` | `#5a5a5a` | Texto secundário forte (horários, contadores) |
| `--tinta-3` | `#8c8c8c` | Rótulos, subtítulos, dias da semana, horas, ícones inativos |
| `--linha` | `#e4e4e1` | Divisor fino de 1px entre linhas e cabeçalhos |
| `--linha-2` | `#ddddda` | Divisor de lista |
| `--borda-bloco` | `#d8d8d5` | Contorno de bloco de evento |
| `--linha-forte` | `#cfcfcc` | Divisor estrutural de topo, moldura |
| `--vermelho` | `#e31919` | **Somente** hoje, prioridade alta, item em destaque, "agora" |
| `--vermelho-claro` | `#fdeaea` | Fundo do item em destaque, marca do dia em foco |

### Regra do vermelho
Usar o vermelho exclusivamente para:
- **hoje** (badge do dia);
- **prioridade alta** (barra lateral do item);
- **item em destaque ou atual** (bloco com fundo `--vermelho-claro` e borda `--vermelho`);
- a linha do **agora**;
- a ação principal flutuante.

Nunca usar vermelho para decorar títulos, e nunca para comunicar sucesso, aviso ou categoria. Verde, amarelo, laranja e azul não fazem parte do token.

## Tipografia
- Sem serifa, densa, com hierarquia **por peso e tamanho, não por cor**. O título do mês é bold grande; o ano vem ao lado, em `--tinta-2` e peso regular.
- Pilha: `-apple-system, BlinkMacSystemFont, "Helvetica Neue", Helvetica, Arial, sans-serif`. Para dados tabulares, usar `font-variant-numeric: tabular-nums`.
- Rótulos de seção em caixa alta, com espaçamento de letras amplo (≈0.12em) e tamanho pequeno ("SEMANA 04", "LIGHT / CALENDAR STUDY").
- Título do bloco em semibold `--tinta`; subtítulo em regular `--tinta-3`.

## Grid, divisores e forma
- Divisores de **1px** (`--linha`, `--linha-2`, `--linha-forte`); não usar sombras.
- Espaçamento generoso: uma ideia por linha de lista e colunas alinhadas (hora | título).
- Cantos levemente arredondados: 6–8px nos blocos de evento e badges; 10–12px nos cartões.
- Bloco de evento: fundo `--superficie-2`, contorno `--borda-bloco`, **barra lateral de 3–4px** em `--tinta` (comum) ou `--vermelho` (prioridade ou atual).
- Ícones lineares de traço fino, em `--tinta-3` quando inativos e `--tinta` quando ativos.

## Layout
- Mobile-first e responsivo: a mesma composição serve à tela de celular e a HTML/SVG largo, sem rolagem horizontal.
- Duas vistas canônicas: **mês** (grade de 7 colunas + lista "Hoje") e **semana** (faixa de dias + trilha horária). A árvore, o board e o dashboard herdam a mesma lógica de lista e bloco.

## Estado sem depender de cor
O estado precisa de ícone e/ou rótulo textual além da cor (acessibilidade; Árvore Visual §Acessibilidade):

| Estado | Tratamento |
|---|---|
| atual / hoje | fundo `--vermelho-claro`, borda ou barra `--vermelho`, rótulo "Atual" |
| liberado | barra `--tinta`, rótulo "Liberado" |
| dependência / bloqueado | ícone 🔒, texto `--tinta-2`, rótulo "Bloqueado (interno/externo)" |
| concluído | ícone ✓, texto `--tinta-3`, rótulo "Concluído" |
| futuro | texto `--tinta-3`, rótulo "Futuro" |

## Modo escuro (suposição reversível, ADR-0003)
A referência é só light mode. Quando uma skill precisar de `light-dark()`, usar uma inversão neutra:
- `--fundo #111111`;
- `--superficie #1a1a1a`;
- `--superficie-2 #222222`;
- `--tinta #f2f2ef`;
- `--tinta-2 #b5b5b0`;
- `--tinta-3 #8c8c8c`;
- linhas `#333333`.

`--vermelho` e sua regra de uso não mudam.

## CSS de referência
```css
:root {
  --fundo:#f2f2ef; --superficie:#ffffff; --superficie-2:#f7f7f5;
  --tinta:#111111; --tinta-2:#5a5a5a; --tinta-3:#8c8c8c;
  --linha:#e4e4e1; --linha-2:#ddddda; --borda-bloco:#d8d8d5; --linha-forte:#cfcfcc;
  --vermelho:#e31919; --vermelho-claro:#fdeaea;
  --raio-bloco:8px; --raio-cartao:12px;
  --fonte:-apple-system,BlinkMacSystemFont,"Helvetica Neue",Helvetica,Arial,sans-serif;
}
```

## Pré-voo de dependências
Antes de renderizar, a skill declara:
- **Dependências de entrada:** os dados canônicos (ex.: `estrutura.json`, grafo, fonte do Mapa-OS) e este token;
- **Saída:** o artefato visual;
- **Gate:** o que ele alimenta.

O protocolo está em `../../references/nucleo-dependencias.md`.
