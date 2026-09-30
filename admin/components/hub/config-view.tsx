import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import type { HubStore } from "~/lib/hub/use-hub-store";

const LABELS: Record<string, string> = {
	statusEditorial: "Status editorial",
	prioridade: "Prioridade",
	tipoConteudo: "Tipo de conteúdo",
	classeEpistemica: "Classe epistêmica",
	canal: "Canal",
	formatoAtivo: "Formato de ativo",
	statusVisual: "Status visual",
	tipoEvidencia: "Tipo de evidência",
	statusDecisao: "Status de decisão",
	tipoDistribuicao: "Tipo de distribuição",
};

export function ConfigView({ store }: { store: HubStore }) {
	const { vocab, setVocab } = store;
	const [drafts, setDrafts] = useState<Record<string, string>>({});

	const add = (k: string) => {
		const v = (drafts[k] ?? "").trim();
		if (!v) return;
		setVocab((p) => ({ ...p, [k]: p[k].includes(v) ? p[k] : [...p[k], v] }));
		setDrafts((p) => ({ ...p, [k]: "" }));
	};

	return (
		<div className="mx-auto w-full max-w-5xl p-6">
			<h2 className="mb-1 text-xl">Listas controladas</h2>
			<p className="mb-6 text-sm text-muted-foreground">
				Vocabulários usados nos menus de seleção. As mudanças refletem em todos os módulos.
			</p>
			<div className="grid gap-4 md:grid-cols-2">
				{Object.keys(vocab).map((k) => (
					<div key={k} className="rounded-xl border bg-card p-4">
						<div className="mb-3 text-sm font-semibold">{LABELS[k] ?? k}</div>
						<div className="mb-3 flex flex-wrap gap-1.5">
							{vocab[k].map((item) => (
								<span key={item} className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs">
									{item}
									<button
										type="button"
										aria-label={`Remover ${item}`}
										className="text-muted-foreground hover:text-foreground"
										onClick={() => setVocab((p) => ({ ...p, [k]: p[k].filter((x) => x !== item) }))}
									>
										<X className="size-3" />
									</button>
								</span>
							))}
						</div>
						<div className="flex gap-2">
							<Input
								placeholder="Adicionar opção…"
								value={drafts[k] ?? ""}
								onChange={(e) => setDrafts((p) => ({ ...p, [k]: e.target.value }))}
								onKeyDown={(e) => e.key === "Enter" && add(k)}
							/>
							<Button variant="outline" size="icon" aria-label="Adicionar" onClick={() => add(k)}>
								<Plus />
							</Button>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
