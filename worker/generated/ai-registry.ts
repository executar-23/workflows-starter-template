// GENERATED FILE — scripts/generate-ai-registry.mjs overwrites this file before build/check/dev.
export type GeneratedAIEntity = {
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
export const AI_REGISTRY_GENERATED_AT = "A DEFINIR";
export const GENERATED_AI_REGISTRY: GeneratedAIEntity[] = [];