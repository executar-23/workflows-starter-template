# Dados e gráficos — DS-DATA-001

| Campo | Valor |
|---|---|
| ID | DS-DATA-001 |
| Versão | 1.0.0 |
| Área | Design System / Dados |
| Status | IMPLEMENTED |
| Showroom | `/admin/design-system#dados` (galeria em `src/components/design-system/data-gallery.tsx`) |
| Decisão | ADR-04 (`CLAUDE.md`) |

## 1. Paleta de gráficos

| Token | Origem | Uso |
|---|---|---|
| `--chart-1` | `--color-brand-default` | série principal |
| `--chart-2` | `--color-attention-default` | segunda série |
| `--chart-3` | `--color-critical-default` | terceira série, risco |
| `--chart-4` | `--brand-500` | série única clara (radar, áreas) |
| `--chart-5` | `--muted-foreground` | meta, referência (tracejado) |

Regra: nenhuma matiz nova (ADR-03). Contraste ≥ 3:1 sobre `--card`, claro e escuro. No escuro,
as famílias usam os tons 300 (provisórios, ADR-03) e `--brand-500` continua a 3,16:1.

## 2. Superfícies e texto cinza

Superfícies de card: `background`, `card`, `popover`, `muted`, `secondary`, `accent`.

| Texto | Token | Regra |
|---|---|---|
| principal | `--foreground` | títulos, valores |
| secundário | `--muted-foreground` | AA (≥ 4,5:1) em todas as superfícies |
| extra cinza | `--muted-foreground-subtle` | legendas, notas, carimbos; AA só em `card`, `background`, `popover` (light 4,66:1; dark 5,2:1 sobre card) |

## 3. Componentes de dados no showroom

- **Indicadores (KPI):** valor, variação com ícone e texto (nunca só cor) e sparkline decorativa.
- **Gráficos:** barras agrupadas (com aba Tabela), barras empilhadas, linhas (série + meta tracejada),
  área, rosca (total no centro, resumo em texto para leitor de tela) e radar.
- **Tabela de dados:** ordenação por cabeçalho (`aria-sort`), seleção de linhas, status com ícone,
  progresso e paginação.
- **Estados:** carregando (`role="status"`, dimensões preservadas), vazio (`Empty`) e erro
  (`Callout` com ação de tentar novamente).

## 4. Acessibilidade

`role="group"` + `aria-label` em cada gráfico; alternativa em tabela; legenda em todos os gráficos
com mais de uma série; cor nunca é o único sinal (tracejado, ícone+texto, rótulos). Verificado por
axe (sem violações serious/critical em `#tokens` e `#dados`) e por testes de contraste.
