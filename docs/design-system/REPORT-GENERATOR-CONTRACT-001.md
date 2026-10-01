# REPORT-GENERATOR-CONTRACT-001

Contrato para agentes (e pessoas) que geram relatórios publicáveis no blog.
Decisão: ADR-05 em `CLAUDE.md` · ADR-BLOG-ASCII-001 · ANX-ADR-BLOG-ASCII-001-A.
Exemplo compilado: `src/pages/admin/relatorio-exemplo.mdx` → `/admin/relatorio-exemplo/`.

## Objetivo

Produzir um relatório completo, pronto para renderização, sem etapa humana de reformatação.

## Formato

MDX compatível com o renderer do projeto. Em `src/content/blog/*.mdx`, `AsciiDiagram` e
`PlainTextPanel` já estão disponíveis sem import. Em páginas MDX avulsas, importe:

```mdx
import { AsciiDiagram, PlainTextPanel } from '@/components/plain';
```

## Regras

1. Markdown convencional para a narrativa.
2. `PlainTextPanel` para conteúdo operacional que precise de destaque, isolamento, cópia ou leitura estrutural.
3. `AsciiDiagram` para hierarquias, processos, arquiteturas, workflows e estruturas.
4. Não converter indiscriminadamente parágrafos em `PlainTextPanel`.
5. Os dois componentes usam o mesmo `PlainSurface` e os mesmos tokens — nunca estilizar localmente.
6. Texto longo em `PlainTextPanel` quebra linha automaticamente; não inserir quebras manuais só para caber na tela.
7. Diagramas preservam rigorosamente espaços, alinhamentos e caracteres Unicode. Use espaços, não tabulações, para alinhar.
8. Todo bloco declara `kind` explícito (`instruction`, `procedure`, `definition`, `decision`, `status`, `evidence`, `example`, `data` para painéis; `flowchart`, `tree`, `mindmap`, `orgchart`, `workflow`, `roadmap`, `architecture`, `directory`, `plan` para diagramas).
9. Processo ou relação estrutural → `AsciiDiagram`, não descrição visual improvisada.
10. A saída é publicável como está.

Também: dar `id` estável (`FLOW-…-001`, `PANEL-…-001`) e `title` a cada bloco; o conteúdo vai em
`` {`…`} `` como filho único (template literal estático, sem `${}`).

## Gramática do relatório

```
REPORT
├── HEADER        título · resumo · metadata · contexto
├── SECTION       narrativa Markdown + PlainTextPanel (definição / instrução / regra)
├── SECTION       narrativa Markdown + AsciiDiagram (processo / hierarquia)
├── SECTION       narrativa + PlainTextPanel (procedimento) + PlainTextPanel (evidência)
├── DECISION      PlainTextPanel kind="decision"
└── FINAL STATE   resultado · evidência · pendências · próxima ação (kind="status")
```

## Sintaxes aceitas

JSX (preferida):

```mdx
<PlainTextPanel id="AUTONOMY-RULE-001" kind="instruction" title="Plain text">
{`
Não iniciar workflows novos diretamente em A3 ou A4.
1. definir escopo;
2. mapear permissões;
`}
</PlainTextPanel>
```

Bloco cercado (curta) — ` ```ascii ` gera `AsciiDiagram`, ` ```plain ` gera `PlainTextPanel`.
Linhas `chave: valor` no topo viram props (`id`, `kind`, `title`, `caption`, `ariaLabel`,
`wrap`, `copyable`, `collapsible`, `density`, `fontSize`, `maxHeight`, `theme`):

````md
```ascii
id: FLOW-AUTONOMY-001
kind: flowchart
title: Progressão
A0
│
▼
A1
```
````

JSON hierárquico (sem desenhar linhas à mão), em TSX/Astro:

```ts
import { renderTree } from '@/components/plain';
const source = renderTree({ label: 'RELATÓRIO', children: [{ label: 'SEÇÃO', children: [{ label: 'item' }] }] });
// RELATÓRIO
// └── SEÇÃO
//     └── item
```

## Checklist de saída

- [ ] narrativa em Markdown; blocos só onde a regra 2 ou 3 se aplica
- [ ] cada bloco com `id`, `kind` e `title`
- [ ] diagramas com espaços (sem tab) e linhas alinhadas
- [ ] nenhum estilo, cor ou classe local
- [ ] `npm run build` sem erros
