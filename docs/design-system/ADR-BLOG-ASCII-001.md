# ADR-BLOG-ASCII-001 — Plain Text Diagram System

| Campo | Valor |
|---|---|
| ID | ADR-BLOG-ASCII-001 (registrado como ADR-05 em `CLAUDE.md`) |
| Versão | 1.0.0 |
| Área | Blog / Design System / Frontend |
| Workflow | Conteúdo → Renderização → Interface |
| Owner | A DEFINIR |
| Status | IMPLEMENTED |
| Automation level | A3 |
| Anexo | `ANX-ADR-BLOG-ASCII-001-A.md` |
| Showroom | `/admin/design-system#plain` · exemplo `/admin/relatorio-exemplo/` |

## 1. Contexto

O blog precisa representar flowcharts, fluxogramas, organogramas, mapas mentais, árvores,
planos operacionais, workflows, estruturas de diretórios e decomposição de projetos
diretamente como texto, preservando alinhamento, hierarquia e caracteres de conexão.

Referência visual: bloco de plain text com fundo cinza muito claro, texto preto, fonte
monoespaçada, bordas arredondadas, botão de copiar, espaços e quebras preservados, rolagem
horizontal quando necessário e azul como cor de interação.

## 2. Decisão

Um componente React canônico, `AsciiDiagram`, representa todo diagrama plain text. Diagramas
**não** são convertidos em SVG ou Canvas; a fonte canônica é texto UTF-8. Caracteres Unicode de
desenho de caixa são permitidos (`│ ├── └── ─ ┌ ┐ └ ┘`, setas `▼ ►`).

## 3. Tipos suportados (`kind`)

`flowchart`, `tree`, `mindmap`, `orgchart`, `workflow`, `roadmap`, `architecture`, `directory`,
`plan`, `generic` — em `src/lib/plain/types.ts`.

## 4. API

```mdx
<AsciiDiagram id="FLOW-OPS-001" title="Organograma OPS / CAVORK" kind="orgchart">
{`
FASE 01
│
├── 01. ENTRADA / PLANEJAMENTO
│   ├── 01.01 Plano
│   └── 01.02 Pesquisa
│
└── 02. PESQUISA / COLETA
`}
</AsciiDiagram>
```

Sintaxe curta equivalente (convertida pelo renderer):

````md
```ascii
id: FLOW-OPS-001
kind: orgchart
title: Organograma OPS / CAVORK
FASE 01
│
└── 02. EXECUÇÃO
```
````

Em TSX/Astro, use a prop `source` (ou `children` string). Para gerar a árvore a partir de JSON:
`<AsciiDiagram kind="tree" source={renderTree(json)} />`.

## 5. Propriedades

`id`, `title`, `kind`, `source` / `children` (string), `theme` (`plain` | `transparent`),
`copyable` (padrão `true`), `collapsible`, `responsive` (padrão `true`; `false` fixa o tamanho),
`wrap` (padrão `false`), `fontSize` (`sm` | `md` | `lg`), `density`
(`compact` | `normal` | `comfortable`), `maxHeight`, `ariaLabel`, `caption`, `className`.

## 6. Design tokens (`src/styles/global.css`)

| Token | Valor |
|---|---|
| `--plain-surface` | `#F8F8F8` (escuro provisório: `--card`) |
| `--plain-border` | `#EBEBEB` (escuro provisório: `--border`) |
| `--plain-text` | `#000000` (escuro provisório: `--foreground`) |
| `--plain-accent` | `var(--primary)` — **desvio:** o `#3A83F7` da captura não foi criado (ADR-03 proíbe matiz nova) |
| `--plain-accent-soft` | `var(--color-brand-subtle)` (no lugar de `#E4EDF5`) |
| `--plain-radius-desktop` / `-mobile` | `28px` / `22px` |
| `--plain-font` | `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace` |
| `--plain-font-size` | `clamp(0.875rem, 1.6vw, 1.125rem)` (piso 0.875rem no mobile) |

## 7. Regras visuais

Sem syntax highlighting; espaços internos e caracteres nunca alterados; quebras preservadas;
fonte monoespaçada; overflow horizontal; contraste alto (≥ 7:1 medido em claro e escuro);
botão Copiar fora da área textual; texto legível no mobile; o texto copiado reproduz a estrutura.

## 8–10. Responsividade, acessibilidade e clipboard

- `<figure data-plain>` → cabeçalho (título + Copiar) → `<pre role="region" aria-label tabindex="0"><code>` → `<figcaption>` opcional (legenda).
- A região rolável é focável por teclado; o título dá nome à figura (`aria-labelledby`).
- Copiar usa um único script delegado (`src/lib/plain/copy.ts`), carregado no `DefaultLayout`.
  Copia só o conteúdo, mostra "Copiado" por 1,6 s e anuncia em `role="status"`.
  Sem JavaScript, o bloco continua legível e selecionável (sem hidratação React).

## 11. Conteúdo e normalização

Fontes: JSX/TSX, MDX, Markdown (bloco cercado), JSON (`renderTree`) ou agente de IA. A saída é
sempre uma string UTF-8 normalizada por `normalizeText` / `normalizeDiagram`
(remove BOM, converte CRLF/CR em LF, remove linhas em branco só nas pontas).

**Desvio técnico registrado:** no Astro, filhos vindos do MDX chegam ao React como HTML, e o
MDX remove indentação dentro de `{…}`. O plugin `src/lib/plain/remarkPlain.ts` relê o template
literal **verbatim** do arquivo-fonte e o passa como `source`. Também converte blocos
` ```ascii ` / ` ```plain `.

## 12. Consequências

Positivas: pesquisável, indexável, copiável, versionável, leve, funciona sem JS, fácil de gerar
por IA, sem biblioteca gráfica. Limitações: diagramas largos rolam; posicionamento limitado à
grade monoespaçada; estruturas altamente gráficas exigem outro renderer.

## 13. Critérios de aceite — estado

| AC | Evidência (`tests/plain.spec.ts`) |
|---|---|
| AC-01 espaços e quebras idênticos à fonte | texto do `<pre>` = fonte; indentação do MDX preservada |
| AC-02 `├ └ │ ─` alinhados | posições x iguais por coluna (Range rects) |
| AC-03 desktop e mobile | 320, 375, 768, 1440 px |
| AC-04 overflow não quebra a página | `scrollWidth` da página = viewport; bloco largo rola por dentro |
| AC-05 Copy retorna o texto original | leitura do clipboard = fonte |
| AC-06 props documentadas | §5 + `plain.types.ts` |
| AC-07 aparência só por tokens | cores/raio computados = tokens; mesma superfície nos dois componentes |
| AC-08 legível sem JavaScript | teste com JS desabilitado |
| AC-09 sem Mermaid/SVG/Canvas | nenhuma dependência gráfica |
| AC-10 sem erro crítico de acessibilidade | axe sem serious/critical em `#plain` e no relatório |

## 14. Resultado (código)

```
src/components/plain/
├── PlainSurface.tsx / .css
├── AsciiDiagram.tsx / .css
├── PlainTextPanel.tsx / .css
├── CopyButton.tsx
├── plain.types.ts
└── index.ts
src/lib/plain/
├── normalizeText.ts
├── normalizeDiagram.ts
├── renderTree.ts
├── remarkPlain.ts
├── copy.ts
└── types.ts
```

A estrutura segue o anexo A (`components/plain/` em vez de `components/ascii/`), que substitui a
proposta inicial do §14 para evitar duplicação entre os dois componentes.

## 15. Tabelas (referência STORE-WIREFRAMES)

Todas as tabelas usam a mesma linguagem: `border-collapse: separate` com espaçamento de 3px,
cabeçalho `--table-head-surface` (#EBEBEB) em caixa alta e peso 500, células `--table-surface`
(#F8F8F8), texto preto, `code` em `--plain-font`, links no primário. Aplicado pela classe
`.ds-table` (componente `Table`) e por `.prose table` (Markdown). Showroom:
`/admin/design-system#plain` → "Tabelas".
