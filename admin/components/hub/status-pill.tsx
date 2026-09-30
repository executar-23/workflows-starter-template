import { cn } from "~/lib/utils";

// Tones map onto the three DS families + neutral (ADR-03). Status is always
// carried by the label text too, never by colour alone.
type Tone = "brand" | "solid" | "attention" | "critical" | "muted";

const STATUS_TONE: Record<string, Tone> = {
	IDEIA: "muted",
	TRIAGEM: "muted",
	APROVADA: "solid",
	PESQUISA: "brand",
	"ARGUMENTAÇÃO": "brand",
	RASCUNHO: "muted",
	"EM PRODUÇÃO": "brand",
	"EM REVISÃO": "attention",
	ACEITO: "solid",
	VALIDADA: "solid",
	"DERIVAÇÃO": "brand",
	PRONTO: "solid",
	AGENDADO: "brand",
	PUBLICADO: "solid",
	"RECIRCULAÇÃO": "brand",
	ATUALIZAR: "attention",
	ARQUIVADO: "muted",
	BLOQUEADO: "critical",
	PLANEJADO: "muted",
	BRIEF: "muted",
	DECIDIDA: "solid",
	PENDENTE: "attention",
	"EM ANÁLISE": "brand",
	"CRÍTICA": "critical",
	ALTA: "attention",
	"MÉDIA": "brand",
	BAIXA: "muted",
};

const TONE_CLASS: Record<Tone, string> = {
	brand:
		"bg-[var(--color-brand-subtle)] text-[var(--color-brand-default)]",
	solid:
		"bg-[var(--color-brand-default)] text-[var(--color-brand-on-default)]",
	attention:
		"bg-[var(--color-attention-subtle)] text-[var(--color-attention-default)]",
	critical:
		"bg-[var(--color-critical-subtle)] text-[var(--color-critical-default)]",
	muted: "bg-muted text-muted-foreground",
};

export function StatusPill({ value }: { value?: string | number | null }) {
	if (!value) {
		return (
			<span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
				—
			</span>
		);
	}
	const tone = STATUS_TONE[String(value)] ?? "muted";
	return (
		<span
			className={cn(
				"inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold",
				TONE_CLASS[tone],
			)}
		>
			{value}
		</span>
	);
}
