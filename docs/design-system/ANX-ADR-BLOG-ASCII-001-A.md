# ANX-ADR-BLOG-ASCII-001-A — Plain Text & Operational Report Presentation System

| Campo | Valor |
|---|---|
| ID | ANX-ADR-BLOG-ASCII-001-A |
| Versão | 1.0.0 |
| Área | Blog / Design System / Editorial System / Frontend |
| Workflow | Conteúdo → Relatório → Renderização → Publicação |
| Owner | A DEFINIR |
| Status | IMPLEMENTED |
| Depende de | ADR-BLOG-ASCII-001 |
| Bloqueava | Report Renderer / MDX Components / AI Report Generator |
| Automation level | A4 |
| Contrato | `REPORT-GENERATOR-CONTRACT-001.md` |

## 1. Objetivo

O padrão "Plain text" vira linguagem editorial oficial do blog. Além de diagramas, é usado —
quando semanticamente adequado — para instruções, procedimentos, regras, decisões, estados,
controles, protocolos, checklists, definições, exemplos extensos, sequências, dados
estruturados, relatórios técnicos, resultados de agentes, evidências e handoffs.

```
RELATÓRIO
│
├── MARKDOWN NORMAL
│   ├── títulos, subtítulos, parágrafos
│   ├── listas, links
│   └── tabelas
│
├── PLAIN TEXT PANEL
│   ├── instrução, procedimento, regra
│   ├── decisão, status, definição
│   └── evidência, texto operacional extenso
│
└── ASCII DIAGRAM
    ├── flowchart, workflow, organograma
    ├── árvore, mapa mental
    └── arquitetura, plano
```

## 2. Regra de composição

O relatório **não** vira um único bloco monoespaçado. Markdown é a camada principal de leitura;
o bloco plain text separa o que precisa ser percebido como executável, operacional,
estruturado, referenciável, copiável, reutilizável ou independente da narrativa.

## 3–4. Paleta e tipografia

Mesmos tokens do ADR (`--plain-*`). Superfície `#F8F8F8`, contorno `#EBEBEB`, texto `#000000`.
**Desvio aprovado:** o azul de interação é `var(--primary)` (primário do site), não `#3A83F7`,
e o azul suave é `--color-brand-subtle`, para cumprir o ADR-03 (sem matiz nova).
Fonte: `--plain-font` (monoespaçada do sistema). Título em `--text-family`, 600.

## 5. `PlainTextPanel`

`kind`: `instruction`, `procedure`, `definition`, `decision`, `status`, `evidence`, `example`,
`data`, `generic`. Props: `id`, `title` (padrão "Plain text"), `kind`, `source` / `children`,
`copyable`, `collapsible` (`<details>` nativo), `density`, `fontSize`, `maxHeight`, `ariaLabel`,
`caption`, `theme`, `className`.

## 6. Diagrama × texto longo (obrigatório)

```
AsciiDiagram
      │
      └── preserva geometria
          white-space: pre · overflow-x: auto
PlainTextPanel
      │
      └── preserva estrutura textual
          white-space: pre-wrap · overflow-wrap: anywhere
```

## 7–10. Implementação

`PlainSurface` é a base comum (superfície, cabeçalho, botão Copiar, legenda, `collapsible`);
`AsciiDiagram` e `PlainTextPanel` só definem a região de conteúdo. Código em
`src/components/plain/` e `src/lib/plain/` (ver ADR §14). Os tokens ficam em
`src/styles/global.css` (fonte única), não em arquivos CSS dos componentes.

## Critérios de aceite — estado

| AC | Estado | Evidência |
|---|---|---|
| AC-01 relatório aceita Markdown normal | ✅ | `/admin/relatorio-exemplo/` |
| AC-02 aceita PlainTextPanel | ✅ | 3 painéis no relatório |
| AC-03 aceita AsciiDiagram | ✅ | JSX + bloco ` ```ascii ` |
| AC-04 mesma superfície visual | ✅ | teste compara estilos computados |
| AC-05 paleta por tokens | ✅ | `--plain-*` |
| AC-06 texto longo quebra | ✅ | `pre-wrap`, sem overflow a 375 px |
| AC-07 diagrama preserva geometria | ✅ | `pre`, alinhamento por coluna |
| AC-08 conteúdo copiável | ✅ | teste de clipboard |
| AC-09 agente produz relatório em MDX | ✅ | contrato + exemplo compilado |
| AC-10 sem reformatação manual | ✅ | normalização + remarkPlain |
| AC-11 desktop e mobile | ✅ | 320–1440 px |
