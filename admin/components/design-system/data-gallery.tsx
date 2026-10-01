import * as React from "react";

import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Ban,
  ChartNoAxesColumn,
  CircleCheck,
  Clock,
  FileText,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Label,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  XAxis,
  YAxis,
} from "recharts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------- data

const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"];
const porTerritorio = meses.map((mes, i) => ({
  mes,
  problema: [4, 6, 5, 8, 7, 9][i],
  metodo: [2, 3, 5, 4, 6, 7][i],
  progresso: [1, 2, 2, 3, 5, 6][i],
}));
const leitura = meses.map((mes, i) => ({
  mes,
  minutos: [5.2, 5.8, 6.1, 6.4, 7.2, 6.9][i],
  meta: 6,
}));
const distribuicao = [
  { territorio: "problema", artigos: 39, fill: "var(--color-problema)" },
  { territorio: "metodo", artigos: 27, fill: "var(--color-metodo)" },
  { territorio: "progresso", artigos: 19, fill: "var(--color-progresso)" },
];
const competencias = [
  { eixo: "Definir", valor: 82 },
  { eixo: "Decompor", valor: 68 },
  { eixo: "Medir", valor: 54 },
  { eixo: "Redesenhar", valor: 71 },
  { eixo: "Apoiar", valor: 46 },
  { eixo: "Avaliar", valor: 60 },
];
const kpis = [
  { label: "Artigos publicados", value: "12", delta: "+3", up: true, series: [3, 4, 4, 6, 8, 12] },
  { label: "Leitura média", value: "6,4 min", delta: "−0,8", up: false, series: [7, 7.4, 7.1, 6.9, 6.6, 6.4] },
  { label: "Conclusão de leitura", value: "68%", delta: "+5 pts", up: true, series: [41, 47, 52, 55, 63, 68] },
  { label: "Achados de revisão", value: "4", delta: "−2", up: true, series: [9, 8, 8, 6, 6, 4] },
];

type Status = "publicado" | "revisao" | "rascunho" | "bloqueado";
const territorios: {
  id: number;
  nome: string;
  artigos: number;
  leitura: number;
  status: Status;
  progresso: number;
}[] = [
  { id: 1, nome: "Risco Cognitivo", artigos: 12, leitura: 6.4, status: "publicado", progresso: 100 },
  { id: 2, nome: "Processo Neuroadaptativo", artigos: 7, leitura: 8.1, status: "revisao", progresso: 64 },
  { id: 3, nome: "Execução Assistida", artigos: 5, leitura: 5.2, status: "rascunho", progresso: 38 },
  { id: 4, nome: "Hub editorial", artigos: 3, leitura: 4.7, status: "bloqueado", progresso: 12 },
];

// Series are told apart by colour AND dash pattern (never colour alone).
const territorioConfig = {
  problema: { label: "Problema", color: "var(--chart-1)" },
  metodo: { label: "Método", color: "var(--chart-2)" },
  progresso: { label: "Progresso", color: "var(--chart-3)" },
} satisfies ChartConfig;
const leituraConfig = {
  minutos: { label: "Leitura média (min)", color: "var(--chart-1)" },
  meta: { label: "Meta (min)", color: "var(--chart-5)" },
} satisfies ChartConfig;
const distribuicaoConfig = {
  artigos: { label: "Artigos" },
  problema: { label: "Problema", color: "var(--chart-1)" },
  metodo: { label: "Método", color: "var(--chart-2)" },
  progresso: { label: "Progresso", color: "var(--chart-3)" },
} satisfies ChartConfig;
const radarConfig = {
  valor: { label: "Cobertura (%)", color: "var(--chart-4)" },
} satisfies ChartConfig;
const sparkConfig = { v: { label: "Série", color: "var(--chart-1)" } } satisfies ChartConfig;

const STATUS = {
  publicado: { label: "Publicado", icon: CircleCheck, tone: "brand" },
  revisao: { label: "Em revisão", icon: Clock, tone: "attention" },
  rascunho: { label: "Rascunho", icon: FileText, tone: "neutral" },
  bloqueado: { label: "Bloqueado", icon: Ban, tone: "critical" },
} as const;

// ---------------------------------------------------------------- pieces

function Panel({
  title,
  description,
  footer,
  children,
  className,
  testId,
}: {
  title: string;
  description?: string;
  footer?: string;
  children: React.ReactNode;
  className?: string;
  testId?: string;
}) {
  return (
    <Card className={cn("min-w-0", className)} data-testid={testId}>
      <CardHeader>
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="min-w-0">{children}</CardContent>
      {footer && (
        <CardFooter>
          {/* extra-gray text: valid on card surfaces only */}
          <p className="text-muted-foreground-subtle text-sm">{footer}</p>
        </CardFooter>
      )}
    </Card>
  );
}

function StatusBadge({ status }: { status: Status }) {
  const s = STATUS[status];
  const Icon = s.icon;
  const tone =
    s.tone === "brand"
      ? "border-[color:var(--color-brand-soft)] bg-[var(--color-brand-subtle)] text-[var(--color-brand-default)]"
      : s.tone === "attention"
        ? "border-[color:var(--color-attention-soft)] bg-[var(--color-attention-subtle)] text-[var(--color-attention-default)]"
        : s.tone === "critical"
          ? "border-[color:var(--color-critical-soft)] bg-[var(--color-critical-subtle)] text-[var(--color-critical-default)]"
          : "bg-muted text-muted-foreground";
  return (
    <Badge variant="outline" className={cn("gap-1", tone)}>
      <Icon aria-hidden="true" />
      {s.label}
    </Badge>
  );
}

function Kpi({ k }: { k: (typeof kpis)[number] }) {
  const data = k.series.map((v, i) => ({ i, v }));
  const Trend = k.up ? TrendingUp : TrendingDown;
  return (
    <Card className="min-w-0 gap-3 py-5" data-testid="kpi">
      <CardHeader className="gap-1">
        <CardDescription>{k.label}</CardDescription>
        <CardTitle className="text-3xl font-medium tracking-tight tabular-nums">
          {k.value}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-end justify-between gap-3">
        <Badge
          variant="outline"
          className={cn(
            "gap-1 tabular-nums",
            k.up
              ? "text-[var(--color-brand-default)]"
              : "text-[var(--color-critical-default)]",
          )}
        >
          <Trend aria-hidden="true" />
          {k.delta}
          <span className="sr-only">{k.up ? "melhora" : "queda"} no período</span>
        </Badge>
        <ChartContainer
          config={sparkConfig}
          className="aspect-auto h-10 w-24 shrink-0"
          aria-hidden="true"
        >
          <LineChart data={data} margin={{ top: 4, right: 2, bottom: 4, left: 2 }}>
            <Line
              dataKey="v"
              type="monotone"
              stroke="var(--color-v)"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function ChartOrTable() {
  return (
    <Tabs defaultValue="grafico" className="gap-4">
      <TabsList>
        <TabsTrigger value="grafico">Gráfico</TabsTrigger>
        <TabsTrigger value="tabela">Tabela</TabsTrigger>
      </TabsList>
      <TabsContent value="grafico">
        <ChartContainer
          config={territorioConfig}
          className="aspect-auto h-64 w-full"
          role="group"
          aria-label="Artigos por território e mês, barras agrupadas"
        >
          <BarChart data={porTerritorio} accessibilityLayer>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="mes" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickLine={false} axisLine={false} width={28} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="problema" fill="var(--color-problema)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
            <Bar dataKey="metodo" fill="var(--color-metodo)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
            <Bar dataKey="progresso" fill="var(--color-progresso)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </ChartContainer>
      </TabsContent>
      <TabsContent value="tabela">
        <div className="overflow-x-auto">
          <Table>
            <TableCaption className="text-muted-foreground-subtle">
              Mesmos dados do gráfico, como tabela.
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Mês</TableHead>
                <TableHead scope="col" className="text-right">Problema</TableHead>
                <TableHead scope="col" className="text-right">Método</TableHead>
                <TableHead scope="col" className="text-right">Progresso</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {porTerritorio.map((r) => (
                <TableRow key={r.mes}>
                  <TableCell className="font-medium">{r.mes}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.problema}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.metodo}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.progresso}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </TabsContent>
    </Tabs>
  );
}

type SortKey = "nome" | "artigos" | "leitura" | "progresso";

function DataTable() {
  const [sort, setSort] = React.useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "artigos",
    dir: "desc",
  });
  const [selected, setSelected] = React.useState<number[]>([2]);

  const rows = React.useMemo(() => {
    const sorted = [...territorios].sort((a, b) => {
      const x = a[sort.key];
      const y = b[sort.key];
      const c = typeof x === "string" ? x.localeCompare(y as string, "pt-BR") : (x as number) - (y as number);
      return sort.dir === "asc" ? c : -c;
    });
    return sorted;
  }, [sort]);

  const allSelected = selected.length === territorios.length;
  const toggle = (id: number) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const SortHead = ({ k, children, right }: { k: SortKey; children: React.ReactNode; right?: boolean }) => {
    const active = sort.key === k;
    const Icon = !active ? ArrowUpDown : sort.dir === "asc" ? ArrowUp : ArrowDown;
    return (
      <TableHead scope="col"
        className={right ? "text-right" : undefined}
        aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
      >
        <Button
          variant="ghost"
          size="sm"
          className={cn("-mx-3", right && "flex-row-reverse")}
          onClick={() =>
            setSort((s) => ({ key: k, dir: s.key === k && s.dir === "desc" ? "asc" : "desc" }))
          }
        >
          {children}
          <Icon aria-hidden="true" />
        </Button>
      </TableHead>
    );
  };

  return (
    <div className="flex flex-col gap-4" data-testid="data-table">
      <div className="overflow-x-auto rounded-xl border">
        <Table>
          <TableCaption className="sr-only">Territórios editoriais, ordenáveis</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead scope="col" className="w-10">
                <Checkbox
                  aria-label="Selecionar todos"
                  checked={allSelected ? true : selected.length ? "indeterminate" : false}
                  onCheckedChange={(v) => setSelected(v ? territorios.map((t) => t.id) : [])}
                />
              </TableHead>
              <SortHead k="nome">Território</SortHead>
              <SortHead k="artigos" right>Artigos</SortHead>
              <SortHead k="leitura" right>Leitura (min)</SortHead>
              <TableHead scope="col">Status</TableHead>
              <SortHead k="progresso">Progresso</SortHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id} data-state={selected.includes(r.id) ? "selected" : undefined}>
                <TableCell>
                  <Checkbox
                    aria-label={`Selecionar ${r.nome}`}
                    checked={selected.includes(r.id)}
                    onCheckedChange={() => toggle(r.id)}
                  />
                </TableCell>
                <TableCell className="font-medium">{r.nome}</TableCell>
                <TableCell className="text-right tabular-nums">{r.artigos}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {r.leitura.toLocaleString("pt-BR", { minimumFractionDigits: 1 })}
                </TableCell>
                <TableCell>
                  <StatusBadge status={r.status} />
                </TableCell>
                <TableCell className="min-w-32">
                  <div className="flex items-center gap-3">
                    <Progress value={r.progresso} aria-label={`Progresso de ${r.nome}`} />
                    <span className="text-muted-foreground w-10 text-right text-sm tabular-nums">
                      {r.progresso}%
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <p className="text-muted-foreground text-sm" aria-live="polite">
          {selected.length} de {territorios.length} selecionados
        </p>
        <Pagination className="mx-0 w-auto">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href="#dados" />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#dados" isActive>
                1
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#dados">2</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext href="#dados" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- gallery

function DataGallery() {
  const [retry, setRetry] = React.useState(0);
  return (
    <div className="flex flex-col gap-10">
      <section aria-labelledby="dados-kpis" className="flex flex-col gap-4">
        <h3 id="dados-kpis" className="text-xl font-medium">
          Indicadores
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((k) => (
            <Kpi key={k.label} k={k} />
          ))}
        </div>
      </section>

      <section aria-labelledby="dados-charts" className="flex flex-col gap-4">
        <h3 id="dados-charts" className="text-xl font-medium">
          Gráficos
        </h3>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2" data-testid="charts">
          <Panel
            title="Barras agrupadas"
            description="Artigos publicados por território"
            footer="Alternar para Tabela dá acesso aos mesmos valores."
          >
            <ChartOrTable />
          </Panel>

          <Panel
            title="Barras empilhadas"
            description="Composição mensal"
            footer="Barras empilhadas somam o total do mês."
          >
            <ChartContainer
              config={territorioConfig}
              className="aspect-auto h-64 w-full"
              role="group"
              aria-label="Artigos por mês, barras empilhadas por território"
            >
              <BarChart data={porTerritorio} accessibilityLayer>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="mes" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} width={28} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="problema" stackId="a" fill="var(--color-problema)" isAnimationActive={false} />
                <Bar dataKey="metodo" stackId="a" fill="var(--color-metodo)" isAnimationActive={false} />
                <Bar dataKey="progresso" stackId="a" fill="var(--color-progresso)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ChartContainer>
          </Panel>

          <Panel
            title="Linhas"
            description="Leitura média e meta"
            footer="Séries com traço e cor distintos: o significado não depende só da cor."
          >
            <ChartContainer
              config={leituraConfig}
              className="aspect-auto h-64 w-full"
              role="group"
              aria-label="Leitura média em minutos e meta por mês, linhas"
            >
              <LineChart data={leitura} accessibilityLayer margin={{ left: 4, right: 8 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="mes" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} width={28} domain={[0, 8]} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Line dataKey="minutos" type="monotone" stroke="var(--color-minutos)" strokeWidth={2.5} dot={{ r: 3 }} isAnimationActive={false} />
                <Line dataKey="meta" type="linear" stroke="var(--color-meta)" strokeWidth={2} strokeDasharray="6 4" dot={false} isAnimationActive={false} />
              </LineChart>
            </ChartContainer>
          </Panel>

          <Panel
            title="Área"
            description="Acumulado por território"
            footer="Áreas com opacidade reduzida deixam a grade visível."
          >
            <ChartContainer
              config={territorioConfig}
              className="aspect-auto h-64 w-full"
              role="group"
              aria-label="Artigos acumulados por mês, área empilhada"
            >
              <AreaChart data={porTerritorio} accessibilityLayer margin={{ left: 4, right: 8 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="mes" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} width={28} />
                <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Area dataKey="problema" type="monotone" stackId="a" stroke="var(--color-problema)" fill="var(--color-problema)" fillOpacity={0.35} isAnimationActive={false} />
                <Area dataKey="metodo" type="monotone" stackId="a" stroke="var(--color-metodo)" fill="var(--color-metodo)" fillOpacity={0.35} isAnimationActive={false} />
                <Area dataKey="progresso" type="monotone" stackId="a" stroke="var(--color-progresso)" fill="var(--color-progresso)" fillOpacity={0.35} isAnimationActive={false} />
              </AreaChart>
            </ChartContainer>
          </Panel>

          <Panel
            title="Rosca"
            description="Distribuição dos 85 artigos"
            footer="O total fica no centro; a legenda repete os rótulos."
          >
            <div
              role="group"
              aria-label="Distribuição de artigos por território, rosca"
            >
              <ul className="sr-only">
              {distribuicao.map((d) => (
                <li key={d.territorio}>
                  {distribuicaoConfig[d.territorio as "problema"].label}: {d.artigos} artigos
                </li>
              ))}
            </ul>
              <div aria-hidden="true">
            <ChartContainer
              config={distribuicaoConfig}
              className="mx-auto aspect-square h-64 w-full max-w-xs"
            >
              <PieChart {...{ rootTabIndex: -1 }}>
                <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="territorio" />} />
                <Pie
                  data={distribuicao}
                  dataKey="artigos"
                  nameKey="territorio"
                  innerRadius={60}
                  rootTabIndex={-1}
                  strokeWidth={3}
                  isAnimationActive={false}
                >
                  <Label
                    content={({ viewBox }) => {
                      if (!viewBox || !("cx" in viewBox)) return null;
                      return (
                        <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                          <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) - 6} className="fill-foreground text-3xl font-medium">
                            85
                          </tspan>
                          <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) + 18} className="fill-muted-foreground text-xs">
                            artigos
                          </tspan>
                        </text>
                      );
                    }}
                  />
                </Pie>
                <ChartLegend content={<ChartLegendContent nameKey="territorio" />} />
              </PieChart>
            </ChartContainer>
              </div>
            </div>
          </Panel>

          <Panel
            title="Radar"
            description="Cobertura por etapa do método"
            footer="Escala de 0 a 100; uma única série usa o tom claro da marca."
          >
            <ChartContainer
              config={radarConfig}
              className="mx-auto aspect-square h-64 w-full max-w-xs"
              role="group"
              aria-label="Cobertura por etapa do método, radar"
            >
              <RadarChart data={competencias} accessibilityLayer>
                <ChartTooltip content={<ChartTooltipContent />} />
                <PolarAngleAxis dataKey="eixo" />
                <PolarGrid />
                <Radar
                  dataKey="valor"
                  stroke="var(--color-valor)"
                  fill="var(--color-valor)"
                  fillOpacity={0.35}
                  dot={{ r: 3, fillOpacity: 1 }}
                  isAnimationActive={false}
                />
              </RadarChart>
            </ChartContainer>
          </Panel>
        </div>
      </section>

      <section aria-labelledby="dados-tabela" className="flex flex-col gap-4">
        <h3 id="dados-tabela" className="text-xl font-medium">
          Tabela de dados
        </h3>
        <p className="text-muted-foreground max-w-2xl text-base font-medium">
          Ordenação por cabeçalho (<code>aria-sort</code>), seleção de linhas, status com ícone e
          texto (nunca só cor), progresso e paginação.
        </p>
        <DataTable />
      </section>

      <section aria-labelledby="dados-estados" className="flex flex-col gap-4">
        <h3 id="dados-estados" className="text-xl font-medium">
          Estados de dados
        </h3>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3" data-testid="data-states">
          <Panel title="Carregando" description="Mantém as dimensões do gráfico">
            <div role="status" aria-live="polite" className="flex flex-col gap-3">
              <Skeleton className="h-40 w-full" />
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <Spinner aria-hidden="true" />
                Carregando dados…
              </div>
            </div>
          </Panel>

          <Panel title="Vazio" description="Sem série para exibir">
            <Empty className="border border-dashed">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ChartNoAxesColumn aria-hidden="true" />
                </EmptyMedia>
                <EmptyTitle>Sem dados no período</EmptyTitle>
                <EmptyDescription>
                  Publique um artigo ou amplie o intervalo para ver este gráfico.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button size="sm" variant="outline">
                  Ampliar período
                </Button>
              </EmptyContent>
            </Empty>
          </Panel>

          <Panel title="Erro" description="Falha ao carregar a série">
            {retry === 0 ? (
              <Callout
                variant="error"
                subject="Erro"
                message="Não foi possível carregar"
                description="A série de leitura não respondeu. Tente novamente em instantes."
                action={{ label: "Tentar novamente", onClick: () => setRetry(1) }}
              />
            ) : (
              <Callout variant="success" subject="Concluído" message="Dados atualizados" />
            )}
          </Panel>
        </div>
      </section>
    </div>
  );
}

export { DataGallery };
