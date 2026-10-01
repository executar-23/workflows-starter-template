import { useEffect, useMemo, useState } from "react";
import { BarChart3, FileJson2, GitBranch, Play, Plus, RefreshCw, Save, Search } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";

export type WorkflowListItem = {
  workflowId: string;
  title: string;
  project: string;
  status: "DRAFT" | "ACTIVE";
  revision: number;
  nodes: number | null;
  updatedAt: string | null;
  publishedAt: string | null;
  source: string;
};

type WorkflowCollection = { items: WorkflowListItem[]; projects: string[] };
type WorkflowDetail = {
  draft: { workflowId: string; text: string; title: string; project: string; updatedAt: string; publishedAt?: string; publishedRevision?: number } | null;
  pointer: { definitionId: string; revision: number; title: string; program: string; nodes: number; createdAt: string } | null;
  published: Record<string, unknown> | null;
  editorText: string;
};

type AnalyticsResponse = {
  summary: {
    workflows: number;
    published: number;
    drafts: number;
    revisions: number;
    nodes: number;
    runs: number | null;
    successRate: number | null;
    medianCycleMs: number | null;
  };
  bottlenecks: unknown[];
  runtimeAvailability: string;
  runtimeNote: string;
  period: { from: string | null; to: string | null };
  source: string;
  generatedAt: string;
};

function WorkflowStatus({ value }: { value: WorkflowListItem["status"] }) {
  const draft = value === "DRAFT";
  return (
    <span className={draft ? "inline-flex rounded-full bg-[var(--color-attention-subtle)] px-2 py-0.5 text-[11px] font-semibold text-[var(--color-attention-default)]" : "inline-flex rounded-full bg-[var(--color-brand-subtle)] px-2 py-0.5 text-[11px] font-semibold text-[var(--color-brand-default)]"}>
      {value}
    </span>
  );
}

function newWorkflowTemplate() {
  const id = "workflow-" + Date.now();
  return JSON.stringify(
    {
      id,
      version: 1,
      program: "Programa EXECUTAR",
      title: "Novo workflow",
      subtitle: "",
      source: [],
      phases: [],
      nodes: [],
    },
    null,
    2,
  );
}

export function WorkflowManagerView({ workflowId, onSelect, onOpenAnalytics }: { workflowId: string | null; onSelect: (id: string) => void; onOpenAnalytics: () => void }) {
  const [collection, setCollection] = useState<WorkflowCollection>({ items: [], projects: [] });
  const [detail, setDetail] = useState<WorkflowDetail | null>(null);
  const [editor, setEditor] = useState("");
  const [creating, setCreating] = useState(false);
  const [project, setProject] = useState("");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadList = async () => {
    const response = await fetch("/api/admin/workflows");
    if (!response.ok) throw new Error("Falha ao carregar workflows");
    setCollection((await response.json()) as WorkflowCollection);
  };

  useEffect(() => {
    void loadList().catch((cause) => setError(String(cause)));
  }, []);

  useEffect(() => {
    if (!workflowId) {
      if (!creating) {
        setDetail(null);
        setEditor("");
      }
      return;
    }
    setCreating(false);
    let alive = true;
    fetch("/api/admin/workflows/" + encodeURIComponent(workflowId))
      .then(async (response) => {
        if (!response.ok) throw new Error("Workflow não encontrado");
        return (await response.json()) as WorkflowDetail;
      })
      .then((data) => {
        if (!alive) return;
        setDetail(data);
        setEditor(data.editorText);
        setError(null);
      })
      .catch((cause) => {
        if (alive) setError(String(cause));
      });
    return () => {
      alive = false;
    };
  }, [workflowId, creating]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return collection.items.filter((item) => {
      if (project && item.project !== project) return false;
      if (!needle) return true;
      return [item.workflowId, item.title, item.project, item.status].join(" ").toLowerCase().includes(needle);
    });
  }, [collection, project, q]);

  const beginNew = () => {
    setCreating(true);
    setDetail(null);
    setEditor(newWorkflowTemplate());
    setMessage(null);
    setError(null);
  };

  const saveDraft = async () => {
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      let id = workflowId;
      if (!id) {
        const parsed = JSON.parse(editor) as { id?: unknown };
        if (typeof parsed.id !== "string" || !parsed.id) throw new Error("Novo workflow precisa de um campo id válido");
        id = parsed.id;
      }
      const response = await fetch(workflowId ? "/api/admin/workflows/" + encodeURIComponent(id) : "/api/admin/workflows", {
        method: workflowId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: editor,
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Falha ao salvar draft");
      await loadList();
      setMessage("Draft salvo no R2.");
      if (!workflowId) onSelect(id);
    } catch (cause) {
      setError(String(cause));
    } finally {
      setBusy(false);
    }
  };

  const publish = async () => {
    if (!workflowId) return;
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      const saveResponse = await fetch("/api/admin/workflows/" + encodeURIComponent(workflowId), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: editor,
      });
      if (!saveResponse.ok) throw new Error("Falha ao salvar draft antes de publicar");
      const response = await fetch("/api/admin/workflows/" + encodeURIComponent(workflowId) + "/publish", { method: "POST" });
      const payload = (await response.json().catch(() => ({}))) as { error?: string; pointer?: { revision?: number } };
      if (!response.ok) throw new Error(payload.error ?? "Falha ao publicar");
      setMessage("Versão publicada" + (payload.pointer?.revision ? " · r" + payload.pointer.revision : "") + ".");
      await loadList();
      const detailResponse = await fetch("/api/admin/workflows/" + encodeURIComponent(workflowId));
      if (detailResponse.ok) setDetail((await detailResponse.json()) as WorkflowDetail);
    } catch (cause) {
      setError(String(cause));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col p-3 md:p-4">
      <div className="mb-3 flex flex-col gap-3 rounded-xl border bg-card p-3 shadow-xs xl:flex-row xl:items-center">
        <div className="min-w-0 flex-1"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Workflow Manager</p><h2 className="text-lg font-semibold">Portfólio multiprojeto e editor versionado</h2></div>
        <div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={onOpenAnalytics}><BarChart3 /> Analytics</Button><Button size="sm" onClick={beginNew}><Plus /> Novo workflow</Button></div>
      </div>

      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(280px,340px)_minmax(0,1fr)]">
        <aside className="flex min-h-0 flex-col rounded-xl border bg-card shadow-xs">
          <div className="space-y-2 border-b p-3">
            <label className="relative block"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Buscar workflow" className="pl-9" /></label>
            <select value={project} onChange={(event) => setProject(event.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm"><option value="">Todos os projetos</option>{collection.projects.map((item) => <option key={item} value={item}>{item}</option>)}</select>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {filtered.length === 0 && <div className="p-4 text-sm text-muted-foreground">Nenhum workflow no filtro atual.</div>}
            {filtered.map((item) => (
              <button key={item.workflowId} type="button" onClick={() => onSelect(item.workflowId)} className={workflowId === item.workflowId ? "mb-1 w-full rounded-lg bg-[var(--color-brand-subtle)] p-3 text-left ring-1 ring-[var(--color-brand-soft)]" : "mb-1 w-full rounded-lg p-3 text-left hover:bg-muted"}>
                <div className="flex items-start justify-between gap-2"><div className="min-w-0"><div className="truncate text-sm font-semibold">{item.title}</div><div className="truncate font-mono text-[11px] text-muted-foreground">{item.workflowId}</div></div><WorkflowStatus value={item.status} /></div>
                <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-muted-foreground"><span className="truncate">{item.project}</span><span>r{item.revision} · {item.nodes ?? "—"} nós</span></div>
              </button>
            ))}
          </div>
        </aside>

        <section className="flex min-h-[520px] min-w-0 flex-col rounded-xl border bg-card shadow-xs">
          {!workflowId && !creating ? (
            <div className="m-auto max-w-md p-8 text-center"><GitBranch className="mx-auto size-8 text-muted-foreground" /><h3 className="mt-3 font-semibold">Selecione um workflow</h3><p className="mt-1 text-sm text-muted-foreground">Abra uma definição existente ou crie um novo draft. Salvar não publica; publicar cria revisão imutável.</p></div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b p-3">
                <div className="min-w-0"><div className="truncate text-sm font-semibold">{creating ? "Novo workflow" : detail?.draft?.title ?? detail?.pointer?.title ?? workflowId}</div><div className="text-xs text-muted-foreground">{creating ? "Draft local ainda não salvo" : detail?.draft?.project ?? detail?.pointer?.program ?? "A DEFINIR"}</div></div>
                <div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => void loadList()}><RefreshCw /> Atualizar</Button><Button variant="outline" size="sm" onClick={saveDraft} disabled={busy}><Save /> Salvar draft</Button>{workflowId && <Button size="sm" onClick={publish} disabled={busy}><Play /> Publicar versão</Button>}{workflowId && <a href={"/?def=" + encodeURIComponent(workflowId)} className="inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium hover:bg-accent"><FileJson2 className="size-4" /> Abrir executor</a>}</div>
              </div>
              {message && <div role="status" className="border-b bg-[var(--color-brand-subtle)] px-4 py-2 text-sm text-[var(--color-brand-default)]">{message}</div>}
              {error && <div role="alert" className="border-b bg-[var(--color-critical-subtle)] px-4 py-2 text-sm text-[var(--color-critical-default)]">{error}</div>}
              <div className="min-h-0 flex-1 p-3"><Textarea value={editor} onChange={(event) => setEditor(event.target.value)} spellCheck={false} aria-label="Definição JSON do workflow" className="h-full min-h-[430px] resize-none font-mono text-xs leading-5" /></div>
              <div className="border-t px-4 py-2 text-xs text-muted-foreground">{detail?.pointer ? "Publicado: r" + detail.pointer.revision + " · " + detail.pointer.nodes + " nós" : "Sem versão publicada."} {detail?.draft?.updatedAt ? "· draft " + new Date(detail.draft.updatedAt).toLocaleString("pt-BR") : ""}</div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function Metric({ label, value, note }: { label: string; value: string | number; note?: string }) {
  return <div className="rounded-xl border bg-card p-4 shadow-xs"><div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</div><div className="mt-2 text-2xl font-semibold">{value}</div>{note && <div className="mt-1 text-xs text-muted-foreground">{note}</div>}</div>;
}

export function WorkflowAnalyticsView({ onBack }: { onBack: () => void }) {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    fetch("/api/admin/workflow-analytics")
      .then(async (response) => {
        if (!response.ok) throw new Error("Falha ao carregar analytics");
        return (await response.json()) as AnalyticsResponse;
      })
      .then((payload) => {
        if (alive) setData(payload);
      })
      .catch((cause) => {
        if (alive) setError(String(cause));
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="space-y-5 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Workflow Analytics</p><h2 className="mt-1 text-xl font-semibold">Portfólio e capacidade estrutural</h2></div><Button variant="outline" size="sm" onClick={onBack}><GitBranch /> Voltar aos workflows</Button></div>
      {error && <div className="rounded-xl bg-[var(--color-critical-subtle)] p-4 text-sm text-[var(--color-critical-default)]">{error}</div>}
      {!data && !error && <div className="rounded-xl border bg-card p-8 text-sm text-muted-foreground">Carregando analytics…</div>}
      {data && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Workflows" value={data.summary.workflows} /><Metric label="Publicados" value={data.summary.published} /><Metric label="Drafts alterados" value={data.summary.drafts} /><Metric label="Revisões" value={data.summary.revisions} /><Metric label="Nós publicados" value={data.summary.nodes} /><Metric label="Runs" value={data.summary.runs ?? "Não indexado"} note={data.runtimeAvailability} /><Metric label="Taxa de sucesso" value={data.summary.successRate == null ? "Não indexado" : String(data.summary.successRate)} /><Metric label="Ciclo mediano" value={data.summary.medianCycleMs == null ? "Não indexado" : String(data.summary.medianCycleMs) + " ms"} /></div>
          <section className="rounded-xl border bg-card p-4 shadow-xs"><div className="flex items-center gap-2"><BarChart3 className="size-4" /><h3 className="font-semibold">Gargalos de execução</h3></div>{data.bottlenecks.length ? <pre className="mt-3 overflow-auto rounded-lg bg-muted p-3 text-xs">{JSON.stringify(data.bottlenecks, null, 2)}</pre> : <div className="mt-3 rounded-lg bg-muted p-4 text-sm text-muted-foreground">{data.runtimeNote}</div>}</section>
          <p className="text-xs text-muted-foreground">Fonte: {data.source} · gerado em {data.generatedAt}. Período: {data.period.from ?? "início não informado"} → {data.period.to ?? "fim não informado"}.</p>
        </>
      )}
    </div>
  );
}