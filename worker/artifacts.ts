import { artifactPrefix, safeFileName } from "../shared/schema";

// Entregáveis reais no R2: campaigns/{cmp}/runs/{run}/{nó}[/{item}]/{arquivo}

export interface ArtifactInfo {
	key: string;
	size: number;
	uploaded: string;
	contentType?: string;
}

export function artifactKey(
	campaignId: string,
	runId: string,
	nodeId: string,
	fileName: string,
	item?: string,
) {
	return `${artifactPrefix(campaignId, runId, nodeId, item)}${safeFileName(fileName)}`;
}

export async function putArtifact(
	bucket: R2Bucket,
	key: string,
	body: ReadableStream | ArrayBuffer | string,
	contentType = "application/octet-stream",
	meta: Record<string, string> = {},
) {
	await bucket.put(key, body, {
		httpMetadata: { contentType },
		customMetadata: meta,
	});
	return key;
}

export async function listArtifacts(
	bucket: R2Bucket,
	prefix: string,
): Promise<ArtifactInfo[]> {
	const out: ArtifactInfo[] = [];
	let cursor: string | undefined;
	do {
		const page = await bucket.list({ prefix, cursor, include: ["httpMetadata"] });
		for (const o of page.objects) {
			out.push({
				key: o.key,
				size: o.size,
				uploaded: o.uploaded.toISOString(),
				contentType: o.httpMetadata?.contentType,
			});
		}
		cursor = page.truncated ? page.cursor : undefined;
	} while (cursor);
	return out;
}

export async function readText(bucket: R2Bucket, key: string) {
	const object = await bucket.get(key);
	return object ? object.text() : null;
}

// Evidência em texto vira arquivo versionado da casa.
export async function saveEvidence(
	bucket: R2Bucket,
	prefix: string,
	evidence: string,
	meta: Record<string, string>,
	attempt = 1,
) {
	const key = `${prefix}evidencia${attempt > 1 ? `-${attempt}` : ""}.md`;
	await putArtifact(bucket, key, evidence, "text/markdown; charset=utf-8", meta);
	return key;
}
