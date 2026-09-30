export type FieldDef = [key: string, label: string, type: string];

export interface HubModule {
	id: string;
	sheet: string;
	label: string;
	plural: string;
	singular: string;
	icon: string;
	idField?: string;
	idPrefix?: string;
	titleField: string;
	titleField2?: string;
	subtitleField?: string;
	keyField?: string;
	fields: FieldDef[];
}

export type HubRecord = { _id: string } & Record<string, string | number | null>;
export type HubData = Record<string, HubRecord[]>;
export type Vocab = Record<string, string[]>;

export interface HubSeed {
	vocab: Vocab;
	tokens: Record<string, string>;
	seed: Record<string, Record<string, string | number | null>[]>;
}
