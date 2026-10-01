import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ArrowLeft, ArrowRight, Bot, GitBranch, Grid2X2, List, Network, Search, Wrench } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { cn } from "~/lib/utils";

export type AIEntity = {
  id: string;
  name: string;
  type: "agent" | "skill";
  area: string;
  status: string;
  version: string;
  headline: string;
  summary: string;
  capabilities: string[];
  dependsOn: string[];
  blocks: string[];
  workflows: string[];
  tags: string[];
  sourcePath: string;
  sourceKind: string;
  plugin: string | null;
};

type RegistryResponse = {
  entities: AIEntity[];
  areas: { id: string; count: number }[];
  generatedAt: string;
  source: string;
};

type DiagramNode = {
  nodeId: string;
  type: "source" | "entity" | "capability" | "decision" | "context";
  label: string;
  detail?: string;
};

type DiagramEdge = { source: string; target: string; edgeType: "data" | "feedback" };
type DiagramResponse = {
  entityId: string;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  groups: { groupId: string; label: string; nodeIds: string[] }[];
  legend: { type: string; label: string; visual: string }[];
};

const readView = () => {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get("view");
    if (fromUrl === "cards" || fromUrl === "list") return fromUrl;
    const stored = localStorage.getItem("admin.ai.view");
    return stored === "list" ? "list" : "cards";
  } catch {
    return "cards";
  }
};

function EntityIcon({ type }: { type: AIEntity["type"] }) {
  return type === "agent" ? <Bot className="size-4" /> : <Wrench className="size-4" />;
}

function StatusBadge({ value }: { value: string }) {
  return (
    <span className="inline-flex rounded-full bg-[var(--color-brand-subtle)] px-2 py-0.5 text-[11px] font-semibold text-[var(--color-brand-default)]">
      {value}
    </span>
  );
}

function WorkspaceSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border bg-card p-4 shadow-xs">
      <h2 className="mb-3 text-sm font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export function AIRegistryView({ onOpen }: { onOpen: (id: string) => void }) {
  const params = new URLSearchParams(window.location.search);
  const [registry, setRegistry] = useState<RegistryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState(params.get("q") ?? "");
  const [area, setArea] = useState(params.get("area") ?? "");
  const [type, setType] = useState(params.get("type") ?? "");
  const [view, setView] = useState<"cards" | "list">(readView);

  useEffect(() => {
    let alive = true;
    fetch("/api/admin/registry")
      .then(async (response) => {
        if (!response.ok) throw new Error("Falha ao carregar o registro de IA");
        return (await response.json()) as RegistryResponse;
      })
      .then((data) => {
        if (alive) setRegistry(data);
      })
      .catch((cause) => {
        if (alive) setError(String(cause));
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("admin.ai.view", view);
      const url = new URL(window.location.href);
      const values = { q, area, type, view };
      for (const [key, value] of Object.entries(values)) {
        if (value) url.searchParams.set(key, value);
        else url.searchParams.delete(key);
      }
      window.history.replaceState(null, "", url);
    } catch {
      // Preferência de visualização é opcional.
    }
  }, [q, area, type, view]);

  const entities = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (registry?.entities ?? []).filter((entity) => {
      if (area && entity.area !== area) return false;
      if (type && entity.type !== type) return false;
      if (!needle) return true;
      return [entity.id, entity.name, entity.headline, entity.summary, ...entity.tags, ...entity.capabilities]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [registry, q, area, type]);

  return (
    <div className="space-y-5 p-4 md:p-6">
      <div className="rounded-2xl border bg-card p-4 shadow-xs md:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">AI Registry</p>
            <h2 className="mt-1 text-xl font-semibold">Skills e agentes registrados</h2>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              O catálogo é regenerado a partir dos arquivos do repositório no build. O perfil segue a taxonomia de Curriculum Vitae.
            </p>
          </div>
          <div className="inline-flex self-start rounded-lg bg-muted p-1" role="group" aria-label="Modo de visualização">
            <Button variant={view === "cards" ? "secondary" : "ghost"} size="sm" onClick={() => setView("cards")}>
              <Grid2X2 /> Cards
            </Button>
            <Button variant={view === "list" ? "secondary" : "ghost"} size="sm" onClick={() => setView("list")}>
              <List /> Lista
            </Button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_180px]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Buscar por nome, ID, tag ou capacidade" className="pl-9" />
          </label>
          <select value={area} onChange={(event) => setArea(event.target.value)} className="h-9 rounded-md border bg-background px-3 text-sm">
            <option value="">Todas as áreas</option>
            {(registry?.areas ?? []).map((item) => (
              <option key={item.id} value={item.id}>{item.id} · {item.count}</option>
            ))}
          </select>
          <select value={type} onChange={(event) => setType(event.target.value)} className="h-9 rounded-md border bg-background px-3 text-sm">
            <option value="">Todos os tipos</option>
            <option value="agent">Agentes</option>
            <option value="skill">Skills</option>
          </select>
        </div>
      </div>

      {error && <div role="alert" className="rounded-xl bg-[var(--color-critical-subtle)] p-4 text-sm text-[var(--color-critical-default)]">{error}</div>}
      {!registry && !error && <div className="rounded-xl border bg-card p-8 text-sm text-muted-foreground">Carregando registro…</div>}
      {registry && entities.length === 0 && <div className="rounded-xl border bg-card p-8 text-sm text-muted-foreground">Nenhuma entidade corresponde aos filtros atuais.</div>}

      {registry && entities.length > 0 && view === "cards" && (
        <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
          {entities.map((entity) => (
            <button key={entity.id} type="button" onClick={() => onOpen(entity.id)} className="group flex min-h-44 flex-col rounded-xl border bg-card p-4 text-left shadow-xs transition hover:border-[var(--color-brand-soft)] hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"><EntityIcon type={entity.type} /></span>
                  <div className="min-w-0">
                    <div className="truncate font-semibold">{entity.name}</div>
                    <div className="truncate font-mono text-[11px] text-muted-foreground">{entity.id}</div>
                  </div>
                </div>
                <StatusBadge value={entity.status} />
              </div>
              <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{entity.headline || "Sem descrição declarada na fonte."}</p>
              <div className="mt-auto flex items-center justify-between gap-3 pt-4 text-xs text-muted-foreground">
                <span className="truncate">{entity.area}</span>
                <ArrowRight className="size-4 shrink-0 transition group-hover:translate-x-0.5" />
              </div>
            </button>
          ))}
        </div>
      )}

      {registry && entities.length > 0 && view === "list" && (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left text-xs text-muted-foreground">
              <tr><th className="px-4 py-3">Entidade</th><th className="px-4 py-3">Tipo</th><th className="px-4 py-3">Área</th><th className="px-4 py-3">Status</th><th className="px-4 py-3"><span className="sr-only">Abrir</span></th></tr>
            </thead>
            <tbody>
              {entities.map((entity) => (
                <tr key={entity.id} className="border-t">
                  <td className="px-4 py-3"><div className="font-semibold">{entity.name}</div><div className="font-mono text-[11px] text-muted-foreground">{entity.id}</div></td>
                  <td className="px-4 py-3 capitalize">{entity.type}</td>
                  <td className="px-4 py-3">{entity.area}</td>
                  <td className="px-4 py-3"><StatusBadge value={entity.status} /></td>
                  <td className="px-4 py-3 text-right"><Button variant="ghost" size="sm" onClick={() => onOpen(entity.id)}>Abrir <ArrowRight /></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {registry && <p className="text-xs text-muted-foreground">Fonte: {registry.source} · gerado em {registry.generatedAt}</p>}
    </div>
  );
}

function useEntity(entityId: string) {
  const [entity, setEntity] = useState<AIEntity | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    fetch("/api/admin/registry/" + encodeURIComponent(entityId))
      .then(async (response) => {
        if (!response.ok) throw new Error(response.status === 404 ? "Entidade não encontrada" : "Falha ao carregar perfil");
        return (await response.json()) as { entity: AIEntity };
      })
      .then((data) => {
        if (alive) setEntity(data.entity);
      })
      .catch((cause) => {
        if (alive) setError(String(cause));
      });
    return () => {
      alive = false;
    };
  }, [entityId]);
  return { entity, error };
}

export function AIProfileView({ entityId, onBack, onDiagram, onWorkflows }: { entityId: string; onBack: () => void; onDiagram: () => void; onWorkflows: () => void }) {
  const { entity, error } = useEntity(entityId);
  if (error) return <div className="p-6"><Button variant="ghost" onClick={onBack}><ArrowLeft /> Voltar</Button><div className="mt-4 rounded-xl bg-[var(--color-critical-subtle)] p-4 text-sm text-[var(--color-critical-default)]">{error}</div></div>;
  if (!entity) return <div className="p-6 text-sm text-muted-foreground">Carregando perfil…</div>;

  const sourceUrl = "https://github.com/executar-23/workflows-starter-template/blob/main/" + entity.sourcePath;
  return (
    <div className="space-y-5 p-4 md:p-6">
      <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft /> Registro de IA</Button>
      <section className="rounded-2xl border bg-card p-5 shadow-xs">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex min-w-0 gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[var(--color-brand-subtle)] text-[var(--color-brand-default)]"><EntityIcon type={entity.type} /></span>
            <div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{entity.type} · {entity.area}</p><h2 className="mt-1 text-2xl font-semibold">{entity.name}</h2><p className="mt-1 font-mono text-xs text-muted-foreground">{entity.id}</p><p className="mt-3 max-w-3xl text-sm text-muted-foreground">{entity.headline || "Headline A DEFINIR"}</p></div>
          </div>
          <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={onWorkflows}><GitBranch /> Ver workflows</Button><Button onClick={onDiagram}><Network /> Abrir diagrama</Button></div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <WorkspaceSection title="Resumo / objetivo"><p className="whitespace-pre-wrap text-sm leading-6">{entity.summary || "A DEFINIR na fonte."}</p></WorkspaceSection>
        <WorkspaceSection title="Identificação"><dl className="grid grid-cols-[120px_1fr] gap-x-3 gap-y-2 text-sm"><dt className="text-muted-foreground">Status</dt><dd><StatusBadge value={entity.status} /></dd><dt className="text-muted-foreground">Versão</dt><dd>{entity.version}</dd><dt className="text-muted-foreground">Origem</dt><dd>{entity.sourceKind}</dd><dt className="text-muted-foreground">Plugin</dt><dd>{entity.plugin ?? "—"}</dd></dl></WorkspaceSection>
        <WorkspaceSection title="Capacidades"><ul className="space-y-2 text-sm">{entity.capabilities.length ? entity.capabilities.map((item) => <li key={item} className="rounded-lg bg-muted px-3 py-2">{item}</li>) : <li className="text-muted-foreground">Nenhuma capacidade declarada explicitamente no arquivo fonte.</li>}</ul></WorkspaceSection>
        <WorkspaceSection title="Dependências"><div className="grid gap-4 md:grid-cols-2"><div><h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Depends on</h3><p className="mt-2 text-sm">{entity.dependsOn.length ? entity.dependsOn.join(", ") : "Nenhuma dependência declarada."}</p></div><div><h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Blocks</h3><p className="mt-2 text-sm">{entity.blocks.length ? entity.blocks.join(", ") : "Nenhum bloqueio declarado."}</p></div></div></WorkspaceSection>
        <WorkspaceSection title="Workflows vinculados"><p className="text-sm">{entity.workflows.length ? entity.workflows.join(", ") : "Nenhum workflow declarado na fonte. Abra o Workflow Manager para associar por contrato."}</p></WorkspaceSection>
        <WorkspaceSection title="Proveniência"><a href={sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"><GitBranch className="size-4" /> {entity.sourcePath}</a><div className="mt-3 flex flex-wrap gap-1.5">{entity.tags.map((tag) => <span key={tag} className="rounded-full bg-muted px-2 py-1 text-[11px] text-muted-foreground">{tag}</span>)}</div></WorkspaceSection>
      </div>
    </div>
  );
}

export function AIDiagramView({ entityId, onBack, onProfile }: { entityId: string; onBack: () => void; onProfile: () => void }) {
  const [diagram, setDiagram] = useState<DiagramResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    fetch("/api/admin/registry/" + encodeURIComponent(entityId) + "/diagram")
      .then(async (response) => {
        if (!response.ok) throw new Error("Falha ao carregar diagrama");
        return (await response.json()) as DiagramResponse;
      })
      .then((data) => {
        if (alive) setDiagram(data);
      })
      .catch((cause) => {
        if (alive) setError(String(cause));
      });
    return () => {
      alive = false;
    };
  }, [entityId]);

  if (error) return <div className="p-6"><Button variant="ghost" onClick={onBack}><ArrowLeft /> Voltar</Button><div className="mt-4 rounded-xl bg-[var(--color-critical-subtle)] p-4 text-sm text-[var(--color-critical-default)]">{error}</div></div>;
  if (!diagram) return <div className="p-6 text-sm text-muted-foreground">Carregando diagrama…</div>;

  const source = diagram.nodes.find((node) => node.type === "source");
  const entity = diagram.nodes.find((node) => node.type === "entity");
  const decision = diagram.nodes.find((node) => node.type === "decision");
  const context = diagram.nodes.find((node) => node.type === "context");
  const capabilities = diagram.nodes.filter((node) => node.type === "capability");

  return (
    <div className="space-y-5 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft /> Registro de IA</Button><Button variant="outline" size="sm" onClick={onProfile}>Abrir perfil CV</Button></div>
      <section className="diagram-scope diagram-grid rounded-2xl border p-4 shadow-xs md:p-6" aria-label="Diagrama estruturado da entidade">
        <div className="mb-5"><p className="text-xs font-semibold uppercase tracking-wider text-[var(--diagram-muted-ink)]">Anatomy of memory systems</p><h2 className="mt-1 text-xl font-semibold text-[var(--diagram-ink)]">{entity?.label ?? entityId}</h2></div>
        <div className="diagram-flow-layout">
          {source && <div className="diagram-node"><span className="diagram-node-kicker">Fonte</span><strong>{source.label}</strong><small>{source.detail}</small></div>}
          <div className="diagram-flow-edge" aria-hidden="true"><span>→</span></div>
          <div className="diagram-group"><span className="diagram-node-kicker">Sistema principal</span>{entity && <div className="diagram-node diagram-node-emphasis"><strong>{entity.label}</strong><small>{entity.detail}</small></div>}<div className="mt-3 grid gap-2 sm:grid-cols-2">{capabilities.map((node) => <div key={node.nodeId} className="diagram-node"><span className="diagram-node-kicker">Capacidade</span><strong>{node.label}</strong></div>)}</div></div>
          <div className="diagram-flow-edge" aria-hidden="true"><span>→</span></div>
          <div className="flex flex-col items-center gap-5">{decision && <div className="diagram-decision"><span>{decision.label}</span></div>}{context && <div className="diagram-node w-full"><span className="diagram-node-kicker">Contexto</span><strong>{context.label}</strong><small>{context.detail}</small></div>}</div>
        </div>
        <div className="diagram-feedback-edge mt-5"><span>↺ Feedback para o sistema principal</span></div>
      </section>

      <section className="rounded-xl border bg-card p-4"><h3 className="text-sm font-semibold">Legenda e outline acessível</h3><div className="mt-3 grid gap-4 lg:grid-cols-2"><ul className="space-y-2 text-sm">{diagram.legend.map((item) => <li key={item.type} className="flex items-center gap-2"><span className={cn("inline-block h-0 w-8 border-t-2", item.type === "feedback" ? "border-dashed border-[var(--diagram-accent)]" : "border-[var(--diagram-line)]")} /> {item.label}</li>)}</ul><ol className="space-y-2 text-sm">{diagram.nodes.map((node) => <li key={node.nodeId}><span className="font-mono text-xs text-muted-foreground">{node.nodeId}</span> · {node.label}</li>)}</ol></div><p className="mt-3 text-xs text-muted-foreground">Relações: {diagram.edges.map((edge) => edge.source + " → " + edge.target + " (" + edge.edgeType + ")").join("; ")}</p></section>
    </div>
  );
}