import {
  ArrowRight,
  Ban,
  BarChart3,
  BadgeCheck,
  Bell,
  BookOpen,
  Braces,
  CircleCheck,
  CircleHelp,
  CircleX,
  Clock,
  FileCheck,
  GitBranch,
  Info,
  Lightbulb,
  Link,
  ListChecks,
  Microscope,
  OctagonAlert,
  Paperclip,
  Play,
  Quote,
  Sparkles,
  Star,
  StickyNote,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";

// DS-CALLOUT-001 §3 (symbols, labels) + PAL-ANNEX-01 §8 (families).
export type CalloutFamily = "brand" | "attention" | "critical";

export const CALLOUT_VARIANTS = {
  approved: { icon: CircleCheck, label: "Aprovado", family: "brand" },
  success: { icon: BadgeCheck, label: "Concluído", family: "brand" },
  info: { icon: Info, label: "Informação", family: "brand" },
  note: { icon: StickyNote, label: "Nota", family: "brand" },
  tip: { icon: Lightbulb, label: "Dica", family: "brand" },
  insight: { icon: Sparkles, label: "Insight", family: "brand" },
  important: { icon: Star, label: "Importante", family: "brand" },
  attention: { icon: Bell, label: "Atenção", family: "attention" },
  warning: { icon: TriangleAlert, label: "Aviso", family: "attention" },
  danger: { icon: OctagonAlert, label: "Risco", family: "critical" },
  error: { icon: CircleX, label: "Erro", family: "critical" },
  blocked: { icon: Ban, label: "Bloqueado", family: "critical" },
  pending: { icon: Clock, label: "Pendente", family: "attention" },
  decision: { icon: GitBranch, label: "Decisão", family: "brand" },
  action: { icon: Play, label: "Ação necessária", family: "brand" },
  "next-step": { icon: ArrowRight, label: "Próximo passo", family: "brand" },
  checklist: { icon: ListChecks, label: "Checklist", family: "brand" },
  evidence: { icon: FileCheck, label: "Evidência", family: "brand" },
  data: { icon: BarChart3, label: "Dados", family: "brand" },
  research: { icon: Microscope, label: "Pesquisa", family: "brand" },
  definition: { icon: BookOpen, label: "Definição", family: "brand" },
  example: { icon: Braces, label: "Exemplo", family: "brand" },
  question: { icon: CircleHelp, label: "Pergunta", family: "brand" },
  reference: { icon: Link, label: "Referência", family: "brand" },
  resource: { icon: Paperclip, label: "Recurso", family: "brand" },
  quote: { icon: Quote, label: "Citação", family: "brand" },
} as const satisfies Record<
  string,
  { icon: LucideIcon; label: string; family: CalloutFamily }
>;

export type CalloutVariant = keyof typeof CALLOUT_VARIANTS;
export type CalloutSize = "sm" | "md" | "lg";
export type CalloutTone = "outline" | "tinted";

export const CALLOUT_VARIANT_NAMES = Object.keys(
  CALLOUT_VARIANTS,
) as CalloutVariant[];

export function getCalloutVariant(variant: string) {
  const entry = CALLOUT_VARIANTS[variant as CalloutVariant];
  if (entry) return entry;
  if (import.meta.env.DEV) {
    console.error(`[Callout] unknown variant "${variant}", falling back to info`);
  }
  return CALLOUT_VARIANTS.info;
}
