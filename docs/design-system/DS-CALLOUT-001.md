# Design Handoff — Família de Callouts do Blog

| Campo | Valor |
|---|---|
| ID | DS-CALLOUT-001 |
| Versão | 1.0.0 |
| Área | Design System / Blog / Editorial UI |
| Workflow | Screenshot → Auditoria visual → Taxonomia → Tokens → Variantes → API → Acessibilidade → Handoff |
| Owner | A DEFINIR |
| Status | IMPLEMENTED (ver "Implementação" no fim) |
| Automation level | A1 |
| Depende de | Design System global do blog |
| Bloqueava | implementação React/Astro, catálogo/showroom e QA visual |
| Evidência | IMG_1472.jpeg, 1170×180 px |
| Resultado esperado | um único componente primitivo capaz de representar todos os callouts editoriais e operacionais sem estilos ad hoc |

## 1. Referência visual extraída

Variante de referência: **Plano Aprovado**.

| Elemento | Medição observada | Token canônico |
|---|---|---|
| Canvas | 1170×180 px | — |
| Callout | ~1072×118 px | callout-size-display |
| Posição | x49 / y24 | contextual |
| Raio | ~32 px | radius-callout-display |
| Padding lateral | ~32 px | space-callout-display-x |
| Ícone circular | ~54×54 px | size-callout-icon-display: 56px |
| Gap ícone → texto | ~24 px | space-callout-icon-gap |
| Borda | ~1 px | border-callout |
| Prefixo "Plano" | bold | font-callout-emphasis |
| "Aprovado" | regular | font-callout-text |

> **Correção v1.1:** o raster é 3× (1170 px = 390 pt). Em CSS px a referência é ~40 px de altura, raio ~11, padding ~11, glifo ~18, texto ~16–17 px — a mesma altura do CTA (`Button size="lg"`, h-10). A mensagem usa fonte monoespaçada.

Cores aproximadas do raster: azul #304E83, texto forte #141414, texto secundário #3A3A39, fundo #FFFFFF, borda neutra ~#D8D8D4, fundo externo ~#F8F8F6. São evidência; no código só existem via aliases de tokens.

## 2. Anatomia canônica

```
Callout
├── IconContainer
│   └── SemanticIcon
├── Content
│   ├── Headline
│   │   ├── Subject / Label
│   │   └── Message / State
│   ├── Description?
│   └── Action?
└── DismissButton?
```

Padrão da imagem: `[CircleCheck] [Plano: 700] [Aprovado: 400]`. Implementação única:

```tsx
<Callout variant="approved" subject="Plano" message="Aprovado" />
```

## 2b. Anatomia completa (v1.2 — referência Material X)

Dois layouts escolhidos automaticamente pelo conteúdo:

- **Compacto** — só headline (sem descrição nem ações): barra única com glifo, assunto (texto, 700) e mensagem (`--font-mono`, 400); altura = CTA (40px no md).
- **Completo** — com descrição, ações ou loading:

```
Callout (card: radius-xl, shadow-md no outline; superfície subtle no tinted)
├── Header   faixa family.subtle · rótulo (subject ?? label) em family.default · ✕ à direita
├── Body     [emblema circular neutro com glifo — só outline, não no sm] + título (mono, family.default) + descrição
└── Footer?  divisor 1px · ações à direita: secundária (outline) + primária (preenchida family.default / on-default)
```

No tinted o header usa `color-mix(subtle, soft 25%)` e o divisor `soft`. Abaixo de 480px o emblema reduz de 56 para 44px.

## 3. Taxonomia — 26 variantes + símbolos (Lucide)

| variant | Símbolo | Label padrão | Tom | Uso |
|---|---|---|---|---|
| approved | CircleCheck | Aprovado | blue | plano/processo aprovado |
| success | BadgeCheck | Concluído | blue | resultado concluído |
| info | Info | Informação | blue | informação contextual |
| note | StickyNote | Nota | blue | observação editorial |
| tip | Lightbulb | Dica | blue | recomendação prática |
| insight | Sparkles | Insight | blue | interpretação relevante |
| important | Star | Importante | blue | informação prioritária |
| attention | Bell | Atenção | amber | exige atenção |
| warning | TriangleAlert | Aviso | amber | possível problema |
| danger | OctagonAlert | Risco | red | risco relevante |
| error | CircleX | Erro | red | falha |
| blocked | Ban | Bloqueado | red | impedimento |
| pending | Clock | Pendente | amber | aguardando condição |
| decision | GitBranch | Decisão | blue | decisão registrada |
| action | Play | Ação necessária | blue | ação requerida |
| next-step | ArrowRight | Próximo passo | blue | continuidade |
| checklist | ListChecks | Checklist | blue | critérios/tarefas |
| evidence | FileCheck | Evidência | blue | evidência ou comprovação |
| data | BarChart3 | Dados | blue | número ou indicador |
| research | Microscope | Pesquisa | blue | achado de pesquisa |
| definition | BookOpen | Definição | blue | conceito/termo |
| example | Braces | Exemplo | blue | exemplo aplicado |
| question | CircleHelp | Pergunta | blue | questão a considerar |
| reference | Link | Referência | blue | fonte/referência |
| resource | Paperclip | Recurso | blue | arquivo/recurso |
| quote | Quote | Citação | blue | citação destacada |

Regra fundamental: a semântica nunca depende só da cor — **símbolo + label + texto = significado**.

## 4. Sistema cromático

| Alias | Referência | Semântica |
|---|---|---|
| callout-accent-blue | #304E83 | informação, positivo, editorial, operacional |
| callout-accent-amber | #8A5A00 | atenção, aviso, pendência |
| callout-accent-red | #A33A32 | erro, risco, bloqueio |

Neutros pertencem ao Design System global. Confirmação permanece azul. Contraste sobre branco: azul ~8.3:1, âmbar ~5.9:1, vermelho ~6.5:1 (AA).

## 5. Tokens canônicos

Ver `src/styles/global.css` (bloco `DS-CALLOUT-001`): acentos, superfícies, texto, borda (1px), geometria derivada dos tokens do site (ver §6), pesos 700/400/400, motion 120/180 ms + `cubic-bezier(.2,0,0,1)`, foco 2px + offset 2px, largura 100%.

## 6. Sizes (v1.1 — derivados dos tokens do Button, `--radius` e `--spacing`)

| size | altura mín. | glifo | padding x / y | gap | raio | texto (headline/linha) |
|---|---|---|---|---|---|---|
| sm | 36 (= Button default) | 16 (= svg do Button) | 12 / 7 | 6 | radius-md (6) | 14/20 |
| md (padrão) | 40 (= Button lg / CTA) | 18 | 12 / 7 | 8 (= Button) | radius-lg (8) | 16/24 |
| lg | 48 | 20 | 16 / 9 | 10 | radius-xl (12) | 18/28 |

Glifo Lucide sem contêiner circular. Assunto: fonte do texto, 700. Mensagem: `--font-mono`, 400. Descrição: fonte do texto, um passo menor que o headline.

## 7. API / Props

| Prop | Tipo | Default | Regra |
|---|---|---|---|
| variant | enum das 26 variantes | obrigatório | controla símbolo e tom |
| subject | string | — | trecho em bold |
| message | string | label da variante | trecho regular |
| description | ReactNode | undefined | conteúdo complementar |
| size | sm \| md \| lg | md | escala |
| action | object | undefined | ação principal |
| secondaryAction | object | undefined | opcional |
| dismissible | boolean | false | fecha callout |
| disabled | boolean | false | só quando interativo |
| loading | boolean | false | conteúdo assíncrono |
| className | string | — | layout externo apenas |
| id | string | — | deep link/analytics |

Não expor: iconColor, borderColor, backgroundColor, iconSize, borderRadius.

## 8. Regra de conteúdo

Headline `<strong>{subject}</strong> {message}`. Limites: subject 1–3 palavras; message ≤ 48 caracteres; descrição ≤ 240; CTA ≤ 24; máximo 2 CTAs; exatamente 1 símbolo. Sem reticências; texto longo quebra linha.

## 9. Estados

Default (superfície neutra) · Hover só se interativo · Focus ring 2px + offset 2px · Active sutil, sem salto · Disabled sem interação · Loading mantém dimensões com `aria-busy=true` · Error usa `error` · Empty não renderiza · Dismissed sai do fluxo · Reduced motion sem transições.

## 10. Responsividade

< 480px sm/md com texto quebrando; 480–767 ícone + headline horizontais; 768–1023 md; ≥1024 md ou lg. No mobile o ícone fica à esquerda e o texto quebra — nunca empilhado centralizado.

## 11. Interações e motion

Callout clicável: hover border/surface 120ms, focus imediato. CTA segue o botão global. Dismiss 180ms. `prefers-reduced-motion: reduce` remove transições e animações. Callouts estáticos não animam.

## 12. Acessibilidade

`<aside aria-label="…">` (ou `role="note"`). Dinâmico: `role="status"`/`aria-live="polite"`; erro bloqueante inserido dinamicamente: `role="alert"`. Ícone `aria-hidden`. Foco visível, ordem DOM = ordem visual, dismiss com `aria-label="Fechar aviso"`, links nativos.

## 13. Edge cases

Texto longo quebra com ícone alinhado ao início; ~40% de expansão sem overflow; descrição ausente não deixa região vazia; ícone desconhecido → Info + erro de dev; ação indisponível não vira botão desabilitado sem necessidade; skeleton preserva altura; rich text permite links, strong, em, listas curtas.

## 14. Do / Don't

| Do | Don't |
|---|---|
| `variant="warning"` | escolher amarelo manualmente |
| ícones Lucide mapeados | emoji ⚠️ |
| um significado por callout | misturar sucesso + warning |
| aliases de tokens | hex no artigo |
| deixar texto quebrar | cortar com "..." |
| callout para destaque real | cada parágrafo vira callout |
| símbolo + texto | depender só da cor |
| uma primitive React | 26 componentes independentes |

## 15. Contrato TypeScript

Ver `src/components/ui/callout.tsx` (`CalloutProps`) e `callout-registry.ts` (`CalloutVariant`, `CalloutSize`). Acrescentado pelo anexo: `tone?: "outline" | "tinted"`; `children` aceito como descrição (MDX).

## 16. Uso da referência

```tsx
<Callout variant="approved" subject="Plano" message="Aprovado" />
```

## 17. Critérios de aceite — estado da implementação

- [x] existe apenas um primitive Callout
- [x] as 26 variantes usam registry central
- [x] cada variante possui exatamente um símbolo padrão
- [x] somente três acentos cromáticos são utilizados
- [x] nenhuma página define hex, ícone ou radius localmente
- [x] approved/md reproduz a referência (medido: altura 40 = CTA, raio 8, padding 12, gap 8, glifo 18, 700 sans / 400 mono)
- [x] sm, md e lg documentados (`/admin/design-system#callouts`)
- [x] responsivo validado em 320, 375, 768, 1024 e 1440 px (testes Playwright)
- [x] teclado e leitor de tela (axe + teste de teclado automatizados)
- [x] contraste mínimo AA validado
- [x] prefers-reduced-motion
- [x] loading, disabled, dismissible e empty implementados
- [x] página de showroom com as 26 variantes
- [x] anatomia completa (header/body/footer) × outline/tinted × 3 famílias, com contraste AA em claro e escuro
- [x] testes visuais contra regressão (`npm run test:visual`)

Dark mode: fora do contrato original; implementado com tokens **provisórios** (ADR-03).
