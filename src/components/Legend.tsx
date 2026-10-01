import { ShapeGlyph } from "./Taxonomy";

const COLORS: [string, string, string][] = [
	["bg-human", "text-background", "Humano"],
	["bg-orchestrator", "text-background", "Orchestrator"],
	["bg-phase", "text-background", "Fase"],
	["bg-agent", "text-background", "Agente"],
	["bg-skill", "text-background", "Skill"],
	["bg-tool", "text-background", "Tool"],
	["bg-deliverable", "text-background", "Entregável"],
	["bg-subdeliverable", "text-background", "Subentregável"],
	["bg-platform", "text-background", "Plataforma"],
	["bg-id", "text-foreground", "ID"],
	["bg-format", "text-background", "Formato"],
];

const SHAPES = [
	["start", "Start"],
	["end", "End"],
	["activity", "Atividade"],
	["subprocess", "Subprocesso"],
	["gate", "Gate exclusivo ×"],
	["parallel-split", "Gateway paralelo +"],
] as const;

export function Legend() {
	return (
		<footer className="mx-4 mb-8 mt-2 flex flex-col gap-3 rounded-[22px] px-5 py-4 ring-1 ring-hairline/70 sm:mx-6">
			<span className="text-[11px] font-bold uppercase tracking-wider">
				Legenda compacta
			</span>
			<div className="flex flex-wrap gap-1.5">
				{COLORS.map(([bg, fg, label]) => (
					<span
						key={label}
						className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${bg} ${fg}`}
					>
						{label}
					</span>
				))}
			</div>
			<div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] font-medium text-ink">
				{SHAPES.map(([kind, label]) => (
					<span key={kind} className="inline-flex items-center gap-1.5">
						<ShapeGlyph kind={kind} size={16} />
						{label}
					</span>
				))}
				<span className="inline-flex items-center gap-1.5">
					<svg width="28" height="8" aria-hidden>
						<path d="M0 4 H28" stroke="var(--foreground)" strokeWidth="1.75" />
					</svg>
					Dependência
				</span>
				<span className="inline-flex items-center gap-1.5">
					<svg width="28" height="8" aria-hidden>
						<path
							d="M0 4 H28"
							stroke="var(--muted-foreground)"
							strokeWidth="1.1"
							strokeDasharray="5 4"
						/>
					</svg>
					Retrabalho
				</span>
				<span className="inline-flex items-center gap-1.5">
					<span className="font-bold tracking-[-1px]">|||</span> Multi-instância
				</span>
			</div>
			<p className="text-[11px] leading-relaxed text-ink-2">
				Posição = dependência · Seta = sequence flow · Cor = tipo semântico ·
				Forma = função · Badge = metadado. Cinza = casa fechada · cor = casa
				alcançada · ▶ AGORA = casa atual (WIP 1: cada OK avança uma casa).
				Status: ○ NOT STARTED · ▷ READY · ◐ IN PROGRESS · ◷ REVIEW · ✓
				APPROVED/VERIFIED · ↗ RELEASED · ✕ BLOCKED.
			</p>
		</footer>
	);
}
