# Anexo — Arquitetura de Paleta para Callouts

| Campo | Valor |
|---|---|
| ID | DS-CALLOUT-001-PAL-ANNEX-01 |
| Versão | 1.1.0 |
| Área | Design System / Editorial / Callouts |
| Workflow | Referência visual → arquitetura cromática → aliases semânticos → component tokens |
| Status | IMPLEMENTED |
| Evidência | IMG_1473.jpeg |
| Escopo | somente arquitetura de paleta |
| Fora do escopo | tipografia, espaçamento, radius, ícones, layout, interação e conteúdo |

A referência adiciona um padrão: superfície tonal derivada da cor principal, com faixa de título mais escura — sem criar cor nova no sistema.

## 1. Leitura cromática

Header em tom escuro; corpo no mesmo universo cromático, muito mais claro/desaturado. Relação: strong/deep → header; default → ícone/destaque; soft → borda/secundários; subtle/tint → superfície do corpo. Header e corpo pertencem à mesma família tonal.

## 2. Máximo de 3 famílias cromáticas

| Família | Função |
|---|---|
| brand | editorial, informação, aprovação, destaque, conhecimento |
| attention | atenção, pendência, aviso |
| critical | erro, risco, bloqueio |

Neutros são infraestrutura. O lilás da fotografia é `brand.subtle`, não purple/lavender.

## 3. Quatro camadas de tokens

PRIMITIVE → SEMANTIC → COMPONENT → VARIANT. Nunca VARIANT → HEX.
Primitivos: `brand.50…950`, `attention.50…950`, `critical.50…950` (neutros do site). Únicos lugares com valores cromáticos concretos.

## 4. Camada semântica

`color.accent.{default,strong,soft,subtle}`, `color.surface.*`, `color.text.*`, `color.border.*` — o restante do sistema não conhece `brand.800`.

## 5. Papéis tonais por família

| Papel | Função | Mapeamento implementado (claro) |
|---|---|---|
| subtle | fundo tonal muito claro | 100 |
| soft | borda / container de ícone | 300 |
| default | ícone, marcador, link | 600 (= hex do handoff) |
| strong | header / fundo enfatizado | 900 |
| on-strong | conteúdo sobre strong | branco |
| on-default | conteúdo sobre default (ação primária) | branco (claro) / 950 (escuro) |

## 6. Tokens exclusivos do Callout

`callout.surface`, `surface-emphasis`, `border`, `icon`, `icon-surface`, `heading`, `body`, `link`, `header-surface`, `header-text`.

## 7. Composições

- **outline** (padrão): surface neutra, acento da família, borda neutra.
- **tinted**: header = mix(subtle, soft 25%) com texto default; corpo = subtle; borda/divisor = soft; título = default; descrição = neutra.
- **outline (anatomia completa)**: header = subtle com texto default; corpo = card; emblema neutro com glifo default.
- **ação primária**: superfície default, texto on-default (branco no claro; 950 da família no escuro).

## 8. Matriz de variantes

brand: approved, success, info, note, tip, insight, important, decision, action, next-step, checklist, evidence, data, research, definition, example, question, reference, resource, quote.
attention: attention, warning, pending.
critical: danger, error, blocked.

26 significados → 3 famílias semânticas → 1 arquitetura cromática.

## 9. Registry

Implementado em CSS (`[data-callout][data-family="…"]` em `src/styles/global.css`) e em `src/components/ui/callout-registry.ts`.

## 10–11. Identidade e regra do lilás

A aparência pode ser recalibrada no Design System sem alterar artigos. Proibido: `--color-lavender`, `--purple-callout`, `--book-box`, `--callout-violet`, `--background-special`. Usar `--color-brand-subtle`.

## 12. Source of Truth

| Item | Status |
|---|---|
| Arquitetura da paleta | VERIFIED |
| Relação de tons | VERIFIED |
| Famílias semânticas | DEFINED |
| Hex definitivos | Handoff principal (#304E83, #8A5A00, #A33A32) como passo 600; escalas geradas em oklch; primário do site mantido |
| Dark mode | PROVISIONAL (papéis invertidos: subtle 950, soft 800, default 300, strong 700) |

Nenhum valor fotografado substituiu automaticamente os tokens existentes do blog.
