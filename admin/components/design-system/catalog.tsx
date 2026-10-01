import * as React from "react";

import "@/lib/plain/copy";

import { ComponentGallery } from "@/components/design-system/component-gallery";
import { DataGallery } from "@/components/design-system/data-gallery";
import { ThemeToggle } from "@/components/design-system/theme-toggle";
import { AsciiDiagram, PlainTextPanel, renderTree } from "@/components/plain";
import type { PlainTextPanelKind } from "@/components/plain";
import { buttonVariants } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { CALLOUT_VARIANTS, CALLOUT_VARIANT_NAMES } from "@/components/ui/callout-registry";
import { cn } from "@/lib/utils";

/**
 * Catálogo /admin/design-system (ADR-DS-ROOT-MIGRATION-001).
 * Port em React de src/pages/admin/design-system.astro do executar-23/Risco-cognitivo-blog:
 * mesmas seções, tokens e componentes reais. Mood board e storyboard do blog dependem de
 * imagens e rotas do blog e não vêm junto; a seção de tema substitui o storyboard.
 */

const sections = [
	{ id: "tema", label: "Tema" },
	{ id: "tokens", label: "Tokens" },
	{ id: "callouts", label: "Callouts" },
	{ id: "dados", label: "Dados e charts" },
	{ id: "plain", label: "Plain text" },
	{ id: "componentes", label: "Componentes" },
];
const families = ["brand", "attention", "critical"] as const;
const steps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
const roles = ["subtle", "soft", "default", "strong", "on-strong"];
const neutrals = [
	["background", "--background"],
	["card", "--card"],
	["muted", "--muted"],
	["border", "--border"],
	["muted-foreground", "--muted-foreground"],
	["foreground", "--foreground"],
	["primary (site)", "--primary"],
];
const surfaces = [
	{ name: "background", v: "--background", extra: true },
	{ name: "card", v: "--card", extra: true },
	{ name: "popover", v: "--popover", extra: true },
	{ name: "muted", v: "--muted", extra: false },
	{ name: "secondary", v: "--secondary", extra: false },
	{ name: "accent", v: "--accent", extra: false },
];
const textLadder = [
	["foreground", "--foreground", "títulos, valores, texto principal"],
	["muted-foreground", "--muted-foreground", "descrições, corpo secundário, eixos"],
	[
		"muted-foreground-subtle",
		"--muted-foreground-subtle",
		"legendas, notas, carimbos de data — só sobre card/background/popover",
	],
];
const chartPalette = [
	["chart-1", "brand.default", "série principal"],
	["chart-2", "attention.default", "segunda série"],
	["chart-3", "critical.default", "terceira série / risco"],
	["chart-4", "brand.500 (primitivo)", "série única clara (radar, áreas)"],
	["chart-5", "muted-foreground", "meta e referência (traço tracejado)"],
];
const plainTokens = [
	["--plain-surface", "#F8F8F8 (escuro: --card)"],
	["--plain-border", "#EBEBEB (escuro: --border)"],
	["--plain-text", "#000000 (escuro: --foreground)"],
	["--plain-accent", "var(--primary) — sem matiz nova"],
	["--plain-accent-soft", "var(--color-brand-subtle)"],
	["--plain-radius-desktop / mobile", "28px / 22px"],
	["--plain-font", "ui-monospace, SFMono-Regular, Menlo…"],
	["--plain-font-size", "clamp(0.875rem, 1.6vw, 1.125rem)"],
];
const tableRows = [
	["TOKENS", "global stylesheet", "tokens + @theme inline", "light/dark", "READY"],
	["UI", "components/ui/*", "shadcn new-york + Radix", "props", "READY"],
	["CALLOUT", "Callout + callout-registry", "26 variantes", "family/tone", "READY"],
	["PLAIN", "AsciiDiagram / PlainTextPanel", "components/plain", "source", "READY"],
	["CATÁLOGO", "/admin/design-system", "esta página", "—", "READY"],
];
const orgchart = `FASE 01
│
├── 01. ENTRADA / PLANEJAMENTO
│   │
│   ├── 01.01 Plano / Campanha
│   │   ├── definir tema
│   │   ├── definir estrutura
│   │   ├── definir objetivo
│   │   └── definir diretrizes
│   │
│   └── 01.02 Pesquisa de Insumos
│       ├── documentos
│       ├── artigos
│       ├── referências
│       ├── imagens
│       └── vídeos
│
└── 02. PESQUISA / COLETA
    ├── 02.01 Executar pesquisa
    └── 02.02 Registrar na base`;
const flowchart = `A0
│
▼
A1
│
▼
A2
│   aprovação humana
▼
A3
│
▼
A4
    executar
    verificar
    evidenciar`;
const treeFromJson = renderTree({
	label: "DESIGN SYSTEM",
	children: [
		{ label: "TOKENS", children: [{ label: "primitivos" }, { label: "semânticos" }, { label: "componente" }] },
		{ label: "UI", children: [{ label: "primitives" }, { label: "Callout" }, { label: "Chart" }] },
		{ label: "PLAIN", children: [{ label: "AsciiDiagram" }, { label: "PlainTextPanel" }] },
	],
});
const mindmap = `                 ┌── definir problema
                 ├── decompor fatores
   RISCO ────────┤
   COGNITIVO     ├── medir exposição
                 └── registrar evidência
                 │
                 ▼
          PROCESSO NEUROADAPTATIVO`;
const wide = `ENTRADA ──► TRIAGEM ──► PESQUISA ──► ESTRUTURA ──► REDAÇÃO ──► REVISÃO TÉCNICA ──► REVISÃO EDITORIAL ──► PUBLICAÇÃO ──► MEDIÇÃO ──► APRENDIZADO`;
const panels: { kind: PlainTextPanelKind; title: string; source: string }[] = [
	{
		kind: "instruction",
		title: "Instrução",
		source: `Não iniciar workflows novos diretamente em A3 ou A4.
Sequência inicial:
1. definir escopo;
2. identificar ferramentas;
3. mapear permissões;
4. executar em A1/A2;
5. ampliar autonomia somente após validação.`,
	},
	{
		kind: "procedure",
		title: "Procedimento",
		source: `01  abrir o briefing
02  listar insumos e fontes
03  validar critérios de conclusão
04  produzir o rascunho
05  registrar evidências da revisão`,
	},
	{
		kind: "decision",
		title: "Decisão",
		source: `DECISÃO   ADOTADA
FONTE     executar-23/Risco-cognitivo-blog
ESCOPO    design system default do frontend
ADR       ADR-DS-ROOT-MIGRATION-001`,
	},
	{
		kind: "status",
		title: "Estado",
		source: `STATUS              IMPLEMENTED_DEFAULT
tokens              OK
componentes         OK
plain text          OK
light / dark        OK`,
	},
];
const spacing = [4, 8, 12, 16, 20, 24, 32, 48, 64];
const radii = [
	["radius-sm (botões)", "var(--radius-sm)"],
	["radius-lg (base)", "var(--radius-lg)"],
	["radius-xl (cards)", "var(--radius-xl)"],
	["callout-sm (= radius-md)", "var(--callout-radius-sm)"],
	["callout-md (= radius-lg)", "var(--callout-radius-md)"],
	["callout-lg (= radius-xl)", "var(--callout-radius-lg)"],
];
const shadows = ["shadow-xs", "shadow-sm", "shadow-md", "shadow-lg", "shadow-xl"];
const h2 = "text-primary scroll-mt-28 text-4xl font-medium";
const lead = "text-muted-foreground mt-3 max-w-2xl text-lg font-medium";

function Section({ id, title, intro, children }: { id: string; title: string; intro: React.ReactNode; children: React.ReactNode }) {
	return (
		<section id={id} className="mt-20" aria-labelledby={`${id}-title`}>
			<h2 id={`${id}-title`} className={h2}>
				{title}
			</h2>
			<p className={lead}>{intro}</p>
			{children}
		</section>
	);
}

export interface DesignSystemCatalogProps {
	/** Link de volta (painel/home do app). */
	backHref?: string;
	backLabel?: string;
	/** Repositório e commit de origem, exibidos no cabeçalho. */
	source?: { repository: string; commit: string };
}

export function DesignSystemCatalog({ backHref = "/", backLabel = "Início", source }: DesignSystemCatalogProps) {
	return (
		<div className="bg-background text-foreground min-h-screen font-sans">
			<div className="mx-auto max-w-5xl px-4 pt-16 pb-24 sm:px-6 lg:pt-24">
				<div className="flex items-center justify-between gap-4">
					<p className="text-muted-foreground text-sm font-medium">
						<a href={backHref} className="hover:underline">
							{backLabel}
						</a>{" "}
						/ Design System
					</p>
					<ThemeToggle />
				</div>
				<h1 className="mt-2 text-3xl tracking-tight sm:text-4xl md:text-5xl lg:text-6xl" style={{ fontFamily: "var(--display-family)", fontWeight: "var(--display-weight)" }}>
					Design System
				</h1>
				<p className={lead}>
					Design system canônico do executar-23, vindo do Risco-cognitivo-blog: tokens, callouts (DS-CALLOUT-001), dados
					(DS-DATA-001), plain text (ADR-BLOG-ASCII-001) e todos os componentes.
				</p>
				{source && (
					<p className="text-muted-foreground-subtle mt-2 font-mono text-xs break-all" data-testid="ds-source">
						{source.repository}@{source.commit}
					</p>
				)}
				<nav aria-label="Seções" className="mt-8 flex flex-wrap gap-2">
					{sections.map((s) => (
						<a key={s.id} href={`#${s.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
							{s.label}
						</a>
					))}
				</nav>

				<Section id="tema" title="Tema" intro="Claro e escuro usam os mesmos papéis semânticos; o botão no topo alterna a classe .dark.">
					<div className="mt-8 grid grid-cols-6 gap-3">
						<div className="col-span-6 flex flex-col justify-between rounded-2xl p-5 sm:col-span-2" style={{ background: "var(--color-brand-strong)", color: "var(--color-brand-on-strong)" }}>
							<span className="text-sm font-medium opacity-80">Display · DM Sans</span>
							<span className="text-4xl font-medium tracking-tight">Aa</span>
						</div>
						<div className="col-span-6 grid min-h-24 grid-cols-3 overflow-hidden rounded-2xl sm:col-span-2">
							<span style={{ background: "var(--color-brand-default)" }} />
							<span style={{ background: "var(--color-attention-default)" }} />
							<span style={{ background: "var(--color-critical-default)" }} />
						</div>
						<div className="bg-card col-span-6 flex flex-col justify-between rounded-2xl border p-5 sm:col-span-2">
							<span className="text-muted-foreground text-sm font-medium">Mono · --font-mono</span>
							<span className="font-mono text-2xl">0123 ├──</span>
						</div>
					</div>
				</Section>

				<Section id="tokens" title="Tokens" intro="Quatro camadas: primitivo → semântico → componente → variante. Valores concretos só existem na camada primitiva.">
					<h3 className="mt-10 text-xl font-medium">Primitivos (3 famílias × 11 passos)</h3>
					<div className="mt-4 flex flex-col gap-3">
						{families.map((f) => (
							<div key={f}>
								<p className="text-muted-foreground mb-2 font-mono text-xs">{f}</p>
								<div className="grid grid-cols-11 overflow-hidden rounded-xl border">
									{steps.map((st) => (
										<div key={st} className="flex h-14 items-end p-1" style={{ background: `var(--${f}-${st})`, color: st >= 600 ? "white" : "black" }}>
											<span className="font-mono text-[10px]">{st}</span>
										</div>
									))}
								</div>
							</div>
						))}
					</div>

					<h3 className="mt-10 text-xl font-medium">Papéis semânticos</h3>
					<p className="text-muted-foreground mt-1 text-sm">Alterne o tema para ver os valores provisórios do modo escuro.</p>
					<div className="mt-4 grid gap-4 md:grid-cols-3">
						{families.map((f) => (
							<div key={f} className="overflow-hidden rounded-xl border">
								{roles.map((r) => (
									<div key={r} className="flex items-center gap-3 border-b p-3 last:border-b-0">
										<span className="size-8 shrink-0 rounded-md border" style={{ background: `var(--color-${f}-${r})` }} />
										<span className="font-mono text-xs">
											--color-{f}-{r}
										</span>
									</div>
								))}
							</div>
						))}
					</div>

					<h3 className="mt-10 text-xl font-medium">Neutros (infraestrutura)</h3>
					<div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
						{neutrals.map(([name, v]) => (
							<div key={name} className="flex items-center gap-3">
								<span className="size-10 shrink-0 rounded-lg border" style={{ background: `var(${v})` }} />
								<span className="font-mono text-xs">{name}</span>
							</div>
						))}
					</div>

					<h3 className="mt-10 text-xl font-medium">Superfícies e texto cinza</h3>
					<p className="text-muted-foreground mt-2 max-w-2xl text-base font-medium">
						O cinza extra (<code>--muted-foreground-subtle</code>) mantém AA só sobre card, background e popover; em muted,
						secondary e accent use <code>--muted-foreground</code>.
					</p>
					<div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="surfaces">
						{surfaces.map((sf) => (
							<div key={sf.name} data-surface={sf.name} className="flex min-w-0 flex-col gap-1 rounded-xl border p-4" style={{ background: `var(${sf.v})` }}>
								<p className="text-foreground font-medium">{sf.name}</p>
								<p className="text-muted-foreground text-sm">Texto secundário sobre {sf.name}.</p>
								{sf.extra ? (
									<p className="text-muted-foreground-subtle text-sm">Texto extra cinza: legenda ou nota.</p>
								) : (
									<p className="text-muted-foreground text-sm">Sem cinza extra nesta superfície.</p>
								)}
								<p className={cn("mt-1 font-mono text-xs", sf.extra ? "text-muted-foreground-subtle" : "text-muted-foreground")}>{sf.v}</p>
							</div>
						))}
					</div>
					<div className="mt-4 grid gap-3 rounded-2xl border p-5 md:grid-cols-3" data-testid="text-ladder">
						{textLadder.map(([n, v, use]) => (
							<div key={n} className="flex min-w-0 flex-col gap-1">
								<p className="text-lg font-medium" style={{ color: `var(${v})` }}>
									Aa — {n}
								</p>
								<p className="text-muted-foreground text-sm">{use}</p>
							</div>
						))}
					</div>

					<h3 className="mt-10 text-xl font-medium">Paleta de gráficos</h3>
					<p className="text-muted-foreground mt-2 max-w-2xl text-base font-medium">
						Derivada das 3 famílias e do neutro (DS-DATA-001): nenhuma matiz nova.
					</p>
					<div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5" data-testid="chart-palette">
						{chartPalette.map(([n, from, use]) => (
							<div key={n} className="flex min-w-0 flex-col gap-2 rounded-xl border p-3">
								<span className="h-12 rounded-lg border" data-chart-swatch={n} style={{ background: `var(--${n})` }} />
								<span className="font-mono text-xs">--{n}</span>
								<span className="text-muted-foreground text-xs">{from}</span>
								<span className="text-muted-foreground-subtle text-xs">{use}</span>
							</div>
						))}
					</div>

					<h3 className="mt-10 text-xl font-medium">Tipografia</h3>
					<div className="mt-4 flex flex-col gap-6 rounded-2xl border p-6" data-testid="typography">
						<div>
							<p className="text-muted-foreground font-mono text-xs">h1 · display</p>
							<p className="text-3xl tracking-tight sm:text-4xl md:text-5xl lg:text-6xl" style={{ fontFamily: "var(--display-family)", fontWeight: "var(--display-weight)" }}>
								Do risco à execução
							</p>
						</div>
						<div>
							<p className="text-muted-foreground font-mono text-xs">h2 · seção</p>
							<p className="text-primary text-4xl font-medium">Territórios</p>
						</div>
						<div>
							<p className="text-muted-foreground font-mono text-xs">corpo · text-lg 500</p>
							<p className="text-muted-foreground max-w-xl text-lg font-medium">
								Compreender o problema. Redesenhar o trabalho. Criar condições para executar.
							</p>
						</div>
						<div>
							<p className="text-muted-foreground font-mono text-xs">callout · 700 / 400</p>
							<p className="text-lg">
								<strong className="font-bold">Plano</strong> <span className="font-mono">Aprovado</span>
							</p>
						</div>
					</div>

					<h3 className="mt-10 text-xl font-medium">Espaçamento, raios, sombras, movimento</h3>
					<div className="mt-4 grid gap-6 md:grid-cols-2">
						<div className="flex flex-col gap-2 rounded-2xl border p-5">
							{spacing.map((px) => (
								<div key={px} className="flex items-center gap-3">
									<span className="w-10 font-mono text-xs">{px}px</span>
									<span className="bg-primary h-3 rounded-sm" style={{ width: `${px * 3}px` }} />
								</div>
							))}
						</div>
						<div className="grid grid-cols-3 gap-3 rounded-2xl border p-5">
							{radii.map(([n, v]) => (
								<div key={n} className="flex flex-col items-center gap-2">
									<span className="bg-muted size-14 border" style={{ borderRadius: v }} />
									<span className="text-center font-mono text-[10px]">{n}</span>
								</div>
							))}
						</div>
						<div className="flex flex-wrap gap-4 rounded-2xl border p-5">
							{shadows.map((sh) => (
								<span key={sh} className={cn("bg-card grid size-20 place-items-center rounded-xl font-mono text-[10px]", sh)}>
									{sh}
								</span>
							))}
						</div>
						<div className="flex flex-col gap-2 rounded-2xl border p-5 font-mono text-xs">
							<span>--callout-motion-fast: 120ms</span>
							<span>--callout-motion-default: 180ms</span>
							<span>--callout-easing: cubic-bezier(0.2, 0, 0, 1)</span>
							<span>prefers-reduced-motion: transições removidas</span>
						</div>
					</div>
				</Section>

				<Section id="callouts" title="Callouts" intro="Um único primitive, 26 variantes, 3 famílias cromáticas, 3 tamanhos, 2 tons e 2 layouts (compacto e anatomia completa).">
					<h3 className="mt-10 text-xl font-medium">Referência — approved · md</h3>
					<div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center" data-testid="callout-proportion">
						<div className="min-w-0 flex-1" data-testid="callout-reference">
							<Callout variant="approved" subject="Plano" message="Aprovado" />
						</div>
						<a href="#callouts" className={buttonVariants({ size: "lg" })}>
							CTA · Button lg
						</a>
					</div>

					<h3 className="mt-10 text-xl font-medium">Anatomia completa · outline × tinted</h3>
					<div className="mt-4 grid gap-6 md:grid-cols-2" data-testid="callout-anatomy">
						<Callout variant="tip" subject="Dica do dia" message="Um procedimento por vez" description="Registre critérios de conclusão antes de automatizar: o agente só apoia o que está explícito." action={{ label: "Ação principal", href: "#callouts" }} secondaryAction={{ label: "Secundária", href: "#callouts" }} dismissible />
						<Callout variant="tip" tone="tinted" subject="Dica do dia" message="Um procedimento por vez" description="Registre critérios de conclusão antes de automatizar: o agente só apoia o que está explícito." action={{ label: "Entendi", href: "#callouts" }} dismissible />
						<Callout variant="warning" subject="Aviso" message="Revise antes de publicar" description="Há fontes sem data de acesso. Confira a seção de referências antes de enviar para revisão." action={{ label: "Revisar", href: "#callouts" }} secondaryAction={{ label: "Depois", href: "#callouts" }} dismissible />
						<Callout variant="warning" tone="tinted" subject="Aviso" message="Revise antes de publicar" description="Há fontes sem data de acesso. Confira a seção de referências antes de enviar para revisão." action={{ label: "Revisar", href: "#callouts" }} secondaryAction={{ label: "Depois", href: "#callouts" }} dismissible />
						<Callout variant="error" subject="Erro" message="Há dados não salvos" description="Sair agora descarta as alterações feitas neste rascunho." action={{ label: "Descartar", href: "#callouts" }} secondaryAction={{ label: "Salvar", href: "#callouts" }} dismissible />
						<Callout variant="error" tone="tinted" subject="Erro" message="Há dados não salvos" description="Sair agora descarta as alterações feitas neste rascunho." action={{ label: "Descartar", href: "#callouts" }} secondaryAction={{ label: "Salvar", href: "#callouts" }} dismissible />
					</div>

					<h3 className="mt-10 text-xl font-medium">26 variantes · md · compacto</h3>
					<div className="mt-4 grid gap-3 md:grid-cols-2" data-testid="callout-variants">
						{CALLOUT_VARIANT_NAMES.map((v) => (
							<Callout key={v} variant={v} subject={CALLOUT_VARIANTS[v].label} message={`${v} · ${CALLOUT_VARIANTS[v].family}`} />
						))}
					</div>

					<h3 className="mt-10 text-xl font-medium">Tamanhos</h3>
					<div className="mt-4 flex flex-col gap-3">
						<Callout variant="info" size="sm" subject="sm" message="cards e barras laterais" />
						<Callout variant="info" size="md" subject="md" message="padrão editorial" />
						<Callout variant="info" size="lg" subject="lg" message="display" />
					</div>

					<h3 className="mt-10 text-xl font-medium">Estados</h3>
					<div className="mt-4 grid gap-3 md:grid-cols-2" data-testid="callout-states">
						<Callout variant="next-step" subject="Próximo passo" message="Publicar" description="Com ações (máximo 2)." action={{ label: "Publicar", href: "#callouts" }} secondaryAction={{ label: "Rever", href: "#callouts" }} />
						<Callout variant="pending" subject="Pendente" message="aguardando revisão" description="Ações desabilitadas." action={{ label: "Publicar" }} disabled />
						<Callout variant="data" subject="Dados" message="carregando" loading />
						<Callout variant="attention" subject="Atenção" message="pode ser fechado" description="dismissible: remove o callout do fluxo." dismissible />
					</div>
				</Section>

				<Section id="dados" title="Dados e charts" intro="Indicadores, seis tipos de gráfico, tabela de dados e estados de carregamento, vazio e erro, todos nos tokens do sistema.">
					<div className="mt-8 min-w-0">
						<DataGallery />
					</div>
				</Section>

				<Section id="plain" title="Plain text e diagramas" intro="Diagramas e textos operacionais como texto UTF-8 com caracteres de desenho de caixa: copiáveis, pesquisáveis e acessíveis (ADR-BLOG-ASCII-001).">
					<h3 className="mt-10 text-xl font-medium">Tokens</h3>
					<div className="mt-4 overflow-x-auto">
						<table className="ds-table" data-testid="plain-tokens">
							<thead>
								<tr>
									<th scope="col">Token</th>
									<th scope="col">Valor</th>
								</tr>
							</thead>
							<tbody>
								{plainTokens.map(([t, v]) => (
									<tr key={t}>
										<td>
											<code>{t}</code>
										</td>
										<td>{v}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>

					<h3 className="mt-10 text-xl font-medium">Tabelas</h3>
					<div className="mt-4 overflow-x-auto" data-testid="table-reference">
						<table className="ds-table">
							<caption className="sr-only">Camadas do design system</caption>
							<thead>
								<tr>
									<th scope="col">Camada</th>
									<th scope="col">Componente</th>
									<th scope="col">Origem</th>
									<th scope="col">Dados</th>
									<th scope="col">Estado</th>
								</tr>
							</thead>
							<tbody>
								{tableRows.map(([n, c, f, d, st]) => (
									<tr key={n}>
										<td>{n}</td>
										<td>
											<code>{c}</code>
										</td>
										<td>{f}</td>
										<td>{d}</td>
										<td>{st}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>

					<h3 className="mt-10 text-xl font-medium">AsciiDiagram · preserva a geometria</h3>
					<div className="mt-4 grid gap-6 lg:grid-cols-2" data-testid="plain-diagrams">
						<AsciiDiagram id="FLOW-OPS-001" kind="orgchart" title="Organograma" source={orgchart} />
						<div className="flex min-w-0 flex-col">
							<AsciiDiagram id="FLOW-AUTONOMY-001" kind="flowchart" title="Progressão de autonomia" source={flowchart} className="mt-0" />
							<AsciiDiagram id="TREE-DS-001" kind="tree" title="Gerado por renderTree(JSON)" source={treeFromJson} caption="Entrada JSON hierárquica; o componente desenha ├── └── │ de forma determinística." />
						</div>
						<AsciiDiagram id="MAP-RISK-001" kind="mindmap" title="Mapa mental" source={mindmap} />
					</div>
					<AsciiDiagram id="FLOW-WIDE-001" kind="workflow" title="Diagrama largo · rolagem horizontal" source={wide} caption="Linhas largas rolam dentro do bloco; a página não ganha rolagem lateral." />

					<h3 className="mt-10 text-xl font-medium">PlainTextPanel · quebra texto longo</h3>
					<div className="mt-4 grid gap-6 lg:grid-cols-2" data-testid="plain-panels">
						{panels.map((p) => (
							<PlainTextPanel key={p.kind} id={`PANEL-${p.kind.toUpperCase()}-001`} kind={p.kind} title={p.title} source={p.source} className="my-0" />
						))}
					</div>
					<div className="mt-4 grid gap-6 lg:grid-cols-2" data-testid="plain-variants">
						<PlainTextPanel id="PANEL-COLLAPSIBLE-001" kind="data" title="collapsible" source={`Conteúdo em <details> nativo:\nabre e fecha sem JavaScript.`} collapsible className="my-0" />
						<PlainTextPanel id="PANEL-NOCOPY-001" kind="generic" title="copyable={false}" source={`Sem botão de copiar.\nO texto continua selecionável.`} copyable={false} className="my-0" />
					</div>
				</Section>

				<Section id="componentes" title="Componentes" intro="Todos os primitivos de components/ui, agrupados por família.">
					<div className="mt-8">
						<ComponentGallery />
					</div>
				</Section>
			</div>
		</div>
	);
}
