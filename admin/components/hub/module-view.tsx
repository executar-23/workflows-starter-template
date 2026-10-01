import { useMemo, useState } from "react";
import { ChevronRight, Plus, Search, Trash2, X } from "lucide-react";
import { Button } from "~/components/ui/button";
import { CmsActions } from "./cms-actions";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { MODULES_BY_ID, nextId, recordTitle } from "~/lib/hub/data";
import type { HubModule, HubRecord } from "~/lib/hub/types";
import type { HubStore } from "~/lib/hub/use-hub-store";
import { cn } from "~/lib/utils";
import { ICONS } from "./icons";
import { StatusPill } from "./status-pill";

function FieldInput({
	type,
	value,
	onChange,
	store,
}: {
	type: string;
	value: string | number | null | undefined;
	onChange: (v: string | number) => void;
	store: HubStore;
}) {
	const v = value ?? "";
	if (type === "id")
		return <Input value={String(v)} readOnly tabIndex={-1} className="font-mono text-xs" />;
	if (type === "longtext")
		return <Textarea rows={3} value={String(v)} onChange={(e) => onChange(e.target.value)} />;
	if (type === "number")
		return (
			<Input
				type="number"
				value={v}
				onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
			/>
		);
	if (type === "date")
		return <Input type="date" value={String(v)} onChange={(e) => onChange(e.target.value)} />;
	if (type === "url")
		return (
			<Input type="url" placeholder="https://…" value={String(v)} onChange={(e) => onChange(e.target.value)} />
		);
	if (type.startsWith("select:")) {
		const vocab = type.slice(7);
		const listId = `dl-${vocab}`;
		return (
			<>
				<Input list={listId} value={String(v)} onChange={(e) => onChange(e.target.value)} />
				<datalist id={listId}>
					{(store.vocab[vocab] ?? []).map((o) => (
						<option value={o} key={o} />
					))}
				</datalist>
			</>
		);
	}
	if (type.startsWith("ref:")) {
		const ref = MODULES_BY_ID[type.slice(4)];
		const records = store.data[ref.id] ?? [];
		return (
			<select
				className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
				value={String(v)}
				onChange={(e) => onChange(e.target.value)}
			>
				<option value="">—</option>
				{records.map((r) => {
					const idVal = ref.idField ? String(r[ref.idField]) : r._id;
					return (
						<option value={idVal} key={r._id}>
							{(ref.idField ? `${idVal} — ` : "") + recordTitle(ref, r)}
						</option>
					);
				})}
			</select>
		);
	}
	return <Input value={String(v)} onChange={(e) => onChange(e.target.value)} />;
}

const PUBLISHABLE = ["ACEITO", "VALIDADA", "PRONTO", "AGENDADO"];

function PublishButton({ record, store }: { record: HubRecord; store: HubStore }) {
	const [state, setState] = useState<"idle" | "running" | "done" | "error">("idle");
	const status = String(record.Status_editorial ?? "");
	if (store.mode !== "remote" || !PUBLISHABLE.includes(status)) return null;
	return (
		<Button
			variant="outline"
			disabled={state === "running"}
			onClick={async () => {
				setState("running");
				try {
					const result = await store.publish(record._id);
					setState(
						result === "complete" || result === "already-published" || result === "queued"
							? "done"
							: "error",
					);
				} catch {
					setState("error");
				}
			}}
		>
			{state === "running"
				? "Publicando…"
				: state === "done"
					? "Enviado ao agente blog-publisher"
					: state === "error"
						? "Falhou — tentar de novo"
						: "Publicar no blog"}
		</Button>
	);
}

function DetailPanel({
	mod,
	record,
	store,
	isNew,
	onSave,
	onDelete,
	onClose,
}: {
	mod: HubModule;
	record: HubRecord;
	store: HubStore;
	isNew: boolean;
	onSave: (draft: HubRecord) => void;
	onDelete: () => void;
	onClose: () => void;
}) {
	// O pai remonta o painel (key) ao trocar de registro, então o rascunho inicia limpo.
	const [draft, setDraft] = useState<HubRecord>(record);

	return (
		<div className="max-w-2xl p-4 md:p-6">
			<div className="mb-4 flex items-start justify-between gap-3">
				<div>
					<div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
						{mod.singular}
					</div>
					<h2 className="mt-1 text-xl">{recordTitle(mod, draft) || "Novo registro"}</h2>
				</div>
				<Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Fechar">
					<X />
				</Button>
			</div>
			<div className="space-y-4">
				{mod.id === "content" && !isNew && <CmsActions record={record} store={store} />}
				{mod.fields.map(([key, label, type]) => (
					<div key={key} className="space-y-1.5">
						<Label htmlFor={undefined}>{label}</Label>
						<FieldInput
							type={type}
							value={draft[key]}
							store={store}
							onChange={(val) => setDraft((d) => ({ ...d, [key]: val }))}
						/>
					</div>
				))}
			</div>
			<div className="sticky bottom-0 mt-6 flex items-center gap-2 border-t bg-background py-4">
				{!isNew && (
					<Button variant="outline" onClick={onDelete} className="text-[var(--color-critical-default)]">
						<Trash2 /> Excluir
					</Button>
				)}
				<div className="flex-1" />
				{mod.id === "content" && !isNew && <PublishButton record={record} store={store} />}
				<Button variant="outline" onClick={onClose}>Cancelar</Button>
				<Button onClick={() => onSave(draft)}>{isNew ? "Criar" : "Salvar"}</Button>
			</div>
		</div>
	);
}

export function ModuleView({
	mod,
	store,
	initialSelectedId,
}: {
	mod: HubModule;
	store: HubStore;
	initialSelectedId?: string | null;
}) {
	const records = useMemo(() => store.data[mod.id] ?? [], [store.data, mod.id]);
	const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId ?? null);
	const [creating, setCreating] = useState(false);
	const [query, setQuery] = useState("");

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		return q ? records.filter((r) => JSON.stringify(r).toLowerCase().includes(q)) : records;
	}, [records, query]);

	const selected = records.find((r) => r._id === selectedId);
	const statusKey = mod.fields.find(([k]) =>
		["Status", "Status_editorial", "Status_brief"].includes(k),
	)?.[0];
	const Icon = ICONS[mod.id];

	const blank = useMemo(() => {
		const d: HubRecord = { _id: "__new__" };
		for (const [key] of mod.fields) d[key] = "";
		if (mod.idField && mod.idPrefix) d[mod.idField] = nextId(records, mod.idField, mod.idPrefix);
		return d;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [mod, creating]);

	const startCreate = () => {
		setCreating(true);
		setSelectedId(null);
	};

	return (
		<div className="flex h-full w-full flex-col md:flex-row">
			<div className="flex max-h-72 w-full shrink-0 flex-col border-b md:max-h-none md:w-80 md:border-r md:border-b-0">
				<div className="flex gap-2 p-3 pb-2">
					<div className="relative flex-1">
						<Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							className="pl-8"
							placeholder={`Buscar em ${mod.plural.toLowerCase()}…`}
							aria-label={`Buscar em ${mod.plural}`}
							value={query}
							onChange={(e) => setQuery(e.target.value)}
						/>
					</div>
					<Button size="sm" onClick={startCreate}><Plus /> Novo</Button>
				</div>
				<div className="px-3 pb-2 text-xs text-muted-foreground">
					{filtered.length} de {records.length} {mod.plural.toLowerCase()}
				</div>
				<div className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-3">
					{filtered.length === 0 && (
						<div className="p-6 text-center text-sm text-muted-foreground">
							<p className="mb-2">Nenhum registro ainda.</p>
							<Button variant="outline" size="sm" onClick={startCreate}>
								<Plus /> Criar o primeiro
							</Button>
						</div>
					)}
					{filtered.map((r) => (
						<button
							key={r._id}
							type="button"
							onClick={() => {
								setSelectedId(r._id);
								setCreating(false);
							}}
							className={cn(
								"flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left hover:bg-accent",
								r._id === selectedId && "bg-[var(--color-brand-subtle)]",
							)}
						>
							<div className="min-w-0 flex-1">
								<div className="truncate text-sm font-medium">{recordTitle(mod, r)}</div>
								{mod.subtitleField && r[mod.subtitleField] ? (
									<div className="truncate text-xs text-muted-foreground">{r[mod.subtitleField]}</div>
								) : null}
							</div>
							{statusKey && r[statusKey] ? (
								<StatusPill value={r[statusKey]} />
							) : (
								<ChevronRight className="size-3.5 text-muted-foreground" />
							)}
						</button>
					))}
				</div>
			</div>

			<div className="min-w-0 flex-1 overflow-y-auto">
				{creating ? (
					<DetailPanel
						key="new"
						mod={mod}
						record={blank}
						store={store}
						isNew
						onClose={() => setCreating(false)}
						onDelete={() => {}}
						onSave={(draft) => {
							const { _id, ...fields } = draft;
							void _id;
							store.addRecord(mod.id, fields);
							setCreating(false);
						}}
					/>
				) : selected ? (
					<DetailPanel
						key={selected._id}
						mod={mod}
						record={selected}
						store={store}
						isNew={false}
						onClose={() => setSelectedId(null)}
						onSave={(draft) => store.updateRecord(mod.id, selected._id, draft)}
						onDelete={() => {
							if (!confirm("Excluir este registro? Esta ação não pode ser desfeita.")) return;
							store.deleteRecord(mod.id, selected._id);
							setSelectedId(null);
						}}
					/>
				) : (
					<div className="flex h-full min-h-48 flex-col items-center justify-center gap-3 p-10 text-center text-sm text-muted-foreground">
						{Icon && <Icon className="size-8" />}
						<p className="max-w-64">
							Selecione um registro à esquerda ou crie um novo {mod.singular.toLowerCase()}.
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
