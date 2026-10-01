#!/usr/bin/env node
// CLI dos agentes do fluxo EXECUTAR (sem dependências).
// Uso: node .claude/skills/executar-flow/scripts/flow.mjs <comando> [opções]

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { basename, dirname } from "node:path";

const BASE = (
	process.env.EXECUTAR_URL || "https://workflows-starter-template.hub-executar.workers.dev"
).replace(/\/$/, "");
const TOKEN = process.env.EXECUTAR_AGENT_TOKEN || "";

const HELP = `flow.mjs — fila de tarefas dos agentes EXECUTAR (WIP = 1)

Ambiente: EXECUTAR_URL (padrão: ${BASE})
          EXECUTAR_AGENT_TOKEN (obrigatório nos comandos de agente)
          EXECUTAR_AGENT_NAME (opcional; ou --agent)

Comandos:
  whoami                               testa URL + token
  tasks [--status S] [--executor E] [--run R] [--limit N]
                                       lista tarefas (S: despachada|em-execucao|aguardando-humano|concluida)
  next [--executor E]                  próxima tarefa despachada (JSON) ou nada
  show <taskId>                        imprime o prompt self-contained
  claim <taskId>                       assume a tarefa (despachada → em-execucao)
  get <chaveR2> [--out arquivo]        baixa um artefato de entrada
  put <runId> <nó> <arquivo> [--item X] [--name nome]
                                       sobe um artefato (imprime a chave R2)
  complete <taskId> (--evidence TXT | --evidence-file F) [--artifact K]... [--gap TXT]... [--pr-url URL --slug S]
                                       conclui a tarefa com evidência
  plan-upload --campaign C --internal F.md --csv F.csv --judge F.txt [--periodo P]
                                       envia o plano upstream (skill plano-operacional-rastreavel)
  def-validate <def.json> [--edges mapa.json]
                                       valida o working process no servidor (dry run)
  def-upload <def.json> [--edges mapa.json]
                                       publica o working process (nova revisão)
  def-put <defId> <arquivo> [--name nome]
                                       sobe artefato da cadeia (cadeia/<defId>/)
  def-list                             lista as definições publicadas
  def-start <defId> [--campaign C]     inicia um run real da definição
  help                                 esta ajuda`;

// Toda flag exige valor; só --artifact e --gap podem repetir.
const REPEATABLE = new Set(["artifact", "gap"]);
function parse(argv) {
	const args = [];
	const opts = {};
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i];
		if (!a.startsWith("--")) {
			args.push(a);
			continue;
		}
		const key = a.slice(2);
		const value = argv[i + 1];
		if (value === undefined || value.startsWith("--") || value.trim() === "") {
			die(`--${key} exige um valor`);
		}
		i++;
		if (opts[key] === undefined) opts[key] = REPEATABLE.has(key) ? [value] : value;
		else if (REPEATABLE.has(key)) opts[key].push(value);
		else die(`--${key} informado mais de uma vez`);
	}
	return { args, opts };
}

const list = (v) => (v === undefined ? [] : [].concat(v));

function die(message, code = 1) {
	console.error(`✗ ${message}`);
	process.exit(code);
}

async function api(path, { method = "GET", body, headers = {}, auth = true, raw = false } = {}) {
	if (auth && !TOKEN) {
		die("EXECUTAR_AGENT_TOKEN não definido (configure a variável de ambiente; nunca cole o token no chat)", 2);
	}
	const res = await fetch(`${BASE}${path}`, {
		method,
		body,
		headers: {
			...(auth ? { Authorization: `Bearer ${TOKEN}` } : {}),
			"X-Agent": agentName,
			...headers,
		},
	}).catch((error) => die(`Falha de rede em ${BASE}${path}: ${error.message}`));
	if (raw) {
		if (!res.ok) die(`${method} ${path} → ${res.status}`);
		return res;
	}
	const text = await res.text();
	let data;
	try {
		data = JSON.parse(text);
	} catch {
		data = { raw: text };
	}
	if (!res.ok) die(`${method} ${path} → ${res.status}: ${JSON.stringify(data)}`);
	return data;
}

const { args, opts } = parse(process.argv.slice(2));
const [command, ...rest] = args;
const agentName = opts.agent || process.env.EXECUTAR_AGENT_NAME || "agente-claude-code";
const enc = encodeURIComponent;

switch (command) {
	case "whoami": {
		const data = await api("/api/agent/whoami");
		console.log(`✓ ${BASE} · agente ${data.agent}`);
		break;
	}
	case "tasks": {
		const q = new URLSearchParams();
		if (opts.status) q.set("status", opts.status);
		if (opts.executor) q.set("executor", opts.executor);
		if (opts.run) q.set("runId", opts.run);
		if (opts.limit) q.set("limit", opts.limit);
		const { tasks } = await api(`/api/tasks?${q}`);
		if (!tasks.length) console.log("(nenhuma tarefa)");
		for (const t of tasks) {
			console.log(
				`${t.status.padEnd(18)} ${t.executor.padEnd(16)} ${t.nodeId.padEnd(5)} ${t.taskId}  ${t.title}${
					t.item ? ` [${t.item}]` : ""
				}`,
			);
		}
		break;
	}
	case "next": {
		const q = new URLSearchParams({ status: "despachada", limit: "1" });
		if (opts.executor) q.set("executor", opts.executor);
		const { tasks } = await api(`/api/tasks?${q}`);
		if (tasks[0]) {
			const { prompt: _prompt, ...summary } = tasks[0];
			console.log(JSON.stringify(summary, null, 2));
		}
		break;
	}
	case "show": {
		if (!rest[0]) die("uso: show <taskId>");
		const { task } = await api(`/api/tasks/${enc(rest[0])}`);
		console.log(task.prompt);
		break;
	}
	case "claim": {
		if (!rest[0]) die("uso: claim <taskId>");
		const data = await api(`/api/tasks/${enc(rest[0])}/claim`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ agent: agentName }),
		});
		console.log(`✓ ${data.task.taskId} em execução por ${data.task.claimedBy}`);
		break;
	}
	case "get": {
		if (!rest[0]) die("uso: get <chaveR2> [--out arquivo]");
		// plans/* exige token; campaigns/* é aberto (manda o token se houver).
		const res = await api(`/api/artifacts/${rest[0].split("/").map(enc).join("/")}`, {
			auth: Boolean(TOKEN) || rest[0].startsWith("plans/"),
			raw: true,
		});
		const buf = Buffer.from(await res.arrayBuffer());
		if (opts.out) {
			mkdirSync(dirname(opts.out), { recursive: true });
			writeFileSync(opts.out, buf);
			console.log(`✓ ${opts.out} (${buf.length} bytes)`);
		} else process.stdout.write(buf);
		break;
	}
	case "put": {
		const [runId, nodeId, file] = rest;
		if (!runId || !nodeId || !file) die("uso: put <runId> <nó> <arquivo> [--item X] [--name nome]");
		const name = opts.name || basename(file);
		const q = opts.item ? `?item=${enc(opts.item)}` : "";
		const type = /\.md$/i.test(name)
			? "text/markdown; charset=utf-8"
			: /\.csv$/i.test(name)
				? "text/csv; charset=utf-8"
				: /\.html?$/i.test(name)
					? "text/html; charset=utf-8"
					: /\.json$/i.test(name)
						? "application/json"
						: /\.png$/i.test(name)
							? "image/png"
							: /\.jpe?g$/i.test(name)
								? "image/jpeg"
								: "application/octet-stream";
		const data = await api(`/api/runs/${enc(runId)}/artifacts/${enc(nodeId)}/${enc(name)}${q}`, {
			method: "PUT",
			headers: { "Content-Type": type },
			body: readFileSync(file),
		});
		console.log(data.key);
		break;
	}
	case "complete": {
		if (!rest[0]) die("uso: complete <taskId> --evidence TXT|--evidence-file F");
		const evidence = opts["evidence-file"]
			? readFileSync(opts["evidence-file"], "utf8")
			: (opts.evidence ?? "");
		const artifacts = list(opts.artifact);
		if (!evidence.trim() && !artifacts.length && !opts["pr-url"])
			die("informe --evidence/--evidence-file, --artifact e/ou --pr-url");
		const data = await api(`/api/tasks/${enc(rest[0])}/complete`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				evidence,
				artifacts,
				gaps: list(opts.gap),
				agent: agentName,
				...(opts["pr-url"] ? { prUrl: opts["pr-url"] } : {}),
				...(opts.slug ? { slug: opts.slug } : {}),
			}),
		});
		console.log(`✓ ${data.task.taskId} concluída — o Worker confere os artefatos no R2`);
		break;
	}
	case "plan-upload": {
		for (const k of ["campaign", "internal", "csv", "judge"]) {
			if (!opts[k]) die(`plan-upload: --${k} obrigatório`);
		}
		const data = await api("/api/plans", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				campaign: opts.campaign,
				periodo: opts.periodo,
				internalMd: readFileSync(opts.internal, "utf8"),
				linearCsv: readFileSync(opts.csv, "utf8"),
				judgeReport: readFileSync(opts.judge, "utf8"),
			}),
		});
		console.log(JSON.stringify(data, null, 2));
		break;
	}
	case "def-validate":
	case "def-upload": {
		if (!rest[0]) die(`uso: ${command} <def.json> [--edges mapa.json]`);
		const definition = JSON.parse(readFileSync(rest[0], "utf8"));
		// mapa-dependencias.json: lista de arestas ou { edges: [...] } com source/target
		const rawEdges = opts.edges ? JSON.parse(readFileSync(opts.edges, "utf8")) : [];
		const edges = (Array.isArray(rawEdges) ? rawEdges : (rawEdges.edges ?? []))
			.filter((e) => e.mandatory !== false)
			.map((e) => ({ source: e.source ?? e.source_artifact_id, target: e.target ?? e.target_artifact_id }));
		const dry = command === "def-validate";
		const data = await api(`/api/definitions${dry ? "?dryRun=1" : ""}`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ definition, edges }),
		});
		console.log(JSON.stringify(dry ? data : { ...data, ui: `${BASE}${data.url}`, pdf: `${BASE}${data.printUrl}` }, null, 2));
		if (dry && !data.ok) process.exit(1);
		break;
	}
	case "def-put": {
		const [defId, file] = rest;
		if (!defId || !file) die("uso: def-put <defId> <arquivo> [--name nome]");
		const name = opts.name || basename(file);
		const types = { md: "text/markdown; charset=utf-8", csv: "text/csv; charset=utf-8", html: "text/html; charset=utf-8", json: "application/json", txt: "text/plain; charset=utf-8", pdf: "application/pdf" };
		const type = types[name.split(".").pop().toLowerCase()] ?? "application/octet-stream";
		const data = await api(`/api/definitions/${enc(defId)}/artifacts/${enc(name)}`, {
			method: "PUT",
			headers: { "Content-Type": type },
			body: readFileSync(file),
		});
		console.log(data.key);
		break;
	}
	case "def-list": {
		const data = await api("/api/definitions", { auth: false });
		for (const d of data.definitions) console.log(`${d.definitionId}\tr${d.revision}\t${d.nodes} nós\t${d.title}`);
		break;
	}
	case "def-start": {
		if (!rest[0]) die("uso: def-start <defId> [--campaign C]");
		const data = await api("/api/workflow/start", {
			method: "POST",
			auth: false,
			headers: {
				"Content-Type": "application/json",
				...(process.env.EXECUTAR_API_TOKEN ? { Authorization: `Bearer ${process.env.EXECUTAR_API_TOKEN}` } : {}),
			},
			body: JSON.stringify({ definitionId: rest[0], ...(opts.campaign ? { campaignId: opts.campaign } : {}) }),
		});
		console.log(JSON.stringify({ ...data, ui: `${BASE}/?def=${enc(rest[0])}&run=${enc(data.instanceId)}` }, null, 2));
		break;
	}
	case "help":
	case undefined:
		console.log(HELP);
		break;
	default:
		die(`comando desconhecido: ${command}\n\n${HELP}`);
}
