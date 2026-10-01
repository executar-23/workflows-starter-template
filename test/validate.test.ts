import { describe, it, expect } from "vitest";
import { WORKFLOW, type WorkflowDefinition } from "../shared/schema";
import { checkDagHonored, validateDefinition } from "../shared/validate";
import fixture from "./fixtures/def-cadeia-min.json";

const clone = () => structuredClone(fixture) as unknown as WorkflowDefinition;
const errorsOf = (mutate: (d: WorkflowDefinition) => void) => {
	const d = clone();
	mutate(d);
	return validateDefinition(d).errors.join(" | ");
};

describe("validateDefinition", () => {
	it("aceita o workflow.json padrão (id reservado liberado só para ele)", () => {
		expect(validateDefinition(WORKFLOW, { allowReserved: true })).toMatchObject({ ok: true });
		expect(validateDefinition(WORKFLOW).errors.join()).toMatch(/reservado/);
	});

	it("aceita a fixture mínima série-paralela", () => {
		const result = validateDefinition(clone());
		expect(result.errors).toEqual([]);
		expect(result.ok).toBe(true);
	});

	it("recusa ciclo / dependência para frente", () => {
		expect(errorsOf((d) => (d.nodes[1].dependsOn = ["T04"]))).toMatch(/vem depois/);
	});

	it("recusa referência inexistente", () => {
		expect(errorsOf((d) => (d.nodes[1].dependsOn = ["X9"]))).toMatch(/inexistente/);
	});

	it("recusa ramificação sem parallel-split", () => {
		expect(
			errorsOf((d) => {
				d.nodes.splice(8, 0, { id: "T05", kind: "activity", title: "Extra", dependsOn: ["T01"] });
			}),
		).toMatch(/exatamente 1 sucessor/);
	});

	it("recusa split cujos ramos não convergem para o join", () => {
		expect(errorsOf((d) => (d.nodes[6].dependsOn = ["T02"]))).toMatch(/sucessor|join|dependência/);
	});

	it("recusa onReject para frente, executor inválido e kind inválido", () => {
		expect(errorsOf((d) => (d.nodes[2].onReject = { target: "T04", label: "x" }))).toMatch(/onReject/);
		expect(errorsOf((d) => ((d.nodes[1] as { executor: string }).executor = "agent:x"))).toMatch(/executor/);
		expect(errorsOf((d) => ((d.nodes[1] as { kind: string }).kind = "task"))).toMatch(/kind/);
	});

	it("recusa gate sem decision e START/END fora do lugar", () => {
		expect(errorsOf((d) => delete d.nodes[2].decision)).toMatch(/decision/);
		expect(errorsOf((d) => d.nodes.reverse())).toMatch(/start|end/);
	});

	it("checkDagHonored aponta arestas invertidas ou inexistentes", () => {
		const d = clone();
		expect(checkDagHonored(d, [{ source: "T01", target: "T04" }])).toEqual([]);
		expect(checkDagHonored(d, [{ source: "T04", target: "T01" }]).join()).toMatch(/invertida/);
		expect(checkDagHonored(d, [{ source: "T01", target: "Z1" }]).join()).toMatch(/inexistente/);
	});
});
