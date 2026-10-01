# DESIGN_SYSTEM

Apontador da fonte de verdade do design system deste repositório (ADR-DS-ROOT-MIGRATION-001).
O registro legível por máquina está em `design-system.manifest.json`.

| Campo | Valor |
| --- | --- |
| SOURCE_REPOSITORY | `executar-23/Risco-cognitivo-blog` |
| SOURCE_BRANCH | `main` (ver nota abaixo) |
| SOURCE_COMMIT | `530afe1708ed24111f9b6756948908ab7e9b3afe` |
| CANONICAL_TOKEN_FILE | `admin/app.css` |
| COMPONENT_DIRECTORY | `admin/components/ui` |
| DESIGN_SYSTEM_ROUTE | `/admin/design-system` |
| CLASSIFICATION | `COMPATIBLE_NATIVE` |
| INTEGRATION_STATUS | `IMPLEMENTED_DEFAULT` |
| LAST_SYNC | 2026-10-01 |
| TARGET_COMMIT_BEFORE | `117e574f2613d8464716b5c99a11319166f54479` |

> Nota sobre a branch: em 2026-10-01 a default branch do GitHub da origem era
> `claude/youthful-archimedes-qksrsl` (`11f78e4`), ancestral direto da `main` (`530afe1`, 7 commits
> à frente). A `main` é a branch de integração declarada no `CLAUDE.md` da origem e traz a versão
> mais nova do design system (tokens `--area-*`, `ScrollArea` com `viewportProps`), por isso é a
> fonte usada aqui.

## Fonte canônica na origem

| Caminho na origem | Caminho aqui | Situação |
| --- | --- | --- |
| `src/styles/global.css` | `admin/app.css` | idêntico; entrypoint global do CMS e do catálogo |
| `src/components/ui/` | `admin/components/ui/` | idêntico (53 componentes + registry de callouts) |
| `src/components/plain/` | `admin/components/plain/` | idêntico |
| `src/lib/plain/` | `admin/lib/plain/` | idêntico, exceto `remarkPlain.ts` (não há Markdown/MDX aqui) |
| `src/lib/utils.ts`, `src/hooks/` | `admin/lib/utils.ts`, `admin/hooks/` | idênticos |
| `src/components/design-system/` | `admin/components/design-system/` | galerias + `catalog.tsx` e `theme-toggle.tsx`; adaptações abaixo |
| `src/pages/admin/design-system.astro` | `admin/design-system/index.html` + `main.tsx` | terceira entrada do Vite |
| `public/fonts/dm-sans/` | `public/fonts/dm-sans/` | idêntico |
| `components.json` | `components.json` | mesmos aliases; `tailwind.css` aponta para `admin/app.css` |
| `docs/design-system/` | `docs/design-system/` | idêntico (`ROUTES-HUB-WORKFLOW-001.md` vale só para a origem) |

O alias `@/` (da origem) e o `~/` (já usado pelo CMS) apontam ambos para `admin/`, no Vite e no `tsconfig.app.json`.

## Adaptações

- `data-gallery.tsx`: `rootTabIndex` passa por spread (`{...{ rootTabIndex: -1 }}`) porque os tipos do recharts 2.15 não declaram a prop; o comportamento em runtime é o mesmo.
- `component-gallery.tsx`: imagens de demonstração apontam para `public/design-system/` em vez de `/about`, `/avatar` e `/blog` do blog.
- `ui/sidebar.tsx`: `import { cva, type VariantProps }` (exigido por `verbatimModuleSyntax`), igual ao react-router-hono-fullstack-template.
- `plain/AsciiDiagram.tsx` e `plain/PlainTextPanel.tsx`: sem o `import * as React` não usado (exigido por `noUnusedLocals`).
- `scripts/inline-entry.js`: uma entrada própria do Vite (`<rota>/index.html`) tem precedência sobre o fallback do CMS, para que `/admin/design-system` sirva o catálogo no deploy inline.

## Mapa de tokens

O CMS (`/admin`) já usava os tokens canônicos. A UI do workflow (`/`, `src/index.css`) tem tokens próprios:

| Token aqui | Token canônico | Decisão |
| --- | --- | --- |
| `--color-ink` (#171717) | `--foreground` | KEEP (só na UI do workflow; migrar quando a tela for redesenhada) |
| `--color-ink-2` (#666666) | `--muted-foreground` | KEEP (idem) |
| `--color-hairline` (#222222) | `--border` | KEEP (idem; a borda do workflow é intencionalmente escura) |
| `--color-muted` (#f5f5f5) | `--muted` | KEEP (valor equivalente ao #F5F5F7) |
| `--color-human`, `--color-orchestrator`, `--color-phase`, `--color-deliverable`, `--color-subdeliverable`, `--color-platform`, `--color-agent`, `--color-id`, `--color-format`, `--color-skill`, `--color-tool` | sem equivalente | KEEP — codificação categórica de 11 tipos de casa (legenda do fluxo); não cabe nas 3 famílias do ADR-03. Trocar exige ADR próprio |
| `--radius-node` (14px), `--radius-container` (22px) | `--radius-*`, `--plain-radius-*` | KEEP (geometria do grafo) |
| `--font-sans` (Inter…) | `--font-sans` (DM Sans…) | KEEP na UI do workflow |

## Regras

- UI nova (CMS, catálogo, telas futuras) usa `admin/components/ui` e os tokens de `admin/app.css`. Não criar cor, raio ou sombra local.
- Os clones (`ui/`, `plain/`, `lib/plain/`, `hooks/`, galerias) ficam idênticos à origem; para mudar, mude na origem e ressincronize.
- Ressincronizar: comparar com o commit da origem, copiar só os arquivos alterados e atualizar `SOURCE_COMMIT`, `LAST_SYNC` e o manifesto no mesmo commit.

## Lacunas conhecidas

- A UI do workflow (`/`) continua com a paleta própria (tabela acima); o design system é o default só do CMS e de UI nova.
- Mood board e storyboard da origem usam imagens e rotas do blog; o catálogo traz no lugar a seção "Tema".
- `/admin/design-system` não tem guarda de autenticação (é estático, sem dados).
