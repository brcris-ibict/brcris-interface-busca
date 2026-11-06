import type { Client } from "es8";

const BATCH_SIZE = 2000;

type OrgUnitSource = { name?: string | string[] };

type ProgramHit = {
  _id?: string;
  _source?: { name?: string | string[]; orgUnit?: OrgUnitSource | OrgUnitSource[] };
  fields?: { "publication.id"?: string[] };
  sort?: (string | number)[];
};

export type ProgramDocument = {
  id: string;
  name: string;
  institutions: string[];
  publicationIds: string[];
};

function firstText(value: string | string[] | undefined) {
  return String((Array.isArray(value) ? value[0] : value) ?? "").trim();
}

function institutionNames(orgUnit: OrgUnitSource | OrgUnitSource[] | undefined) {
  const list = Array.isArray(orgUnit) ? orgUnit : orgUnit ? [orgUnit] : [];
  const names = list
    .flatMap((item) => (Array.isArray(item?.name) ? item.name : [item?.name]))
    .map((name) => String(name ?? "").trim())
    .filter(Boolean);
  return [...new Set(names)];
}

// Lê todos os programas em lotes (search_after), sem depender da janela de 10.000 do from/size
export async function fetchAllPrograms(client: Client, index: string): Promise<ProgramDocument[]> {
  const programs: ProgramDocument[] = [];
  let searchAfter: (string | number)[] | undefined;

  for (;;) {
    const response = await client.search({
      index,
      size: BATCH_SIZE,
      _source: ["name", "orgUnit.name"],
      docvalue_fields: ["publication.id"],
      sort: [{ _doc: { order: "asc" } }],
      ...(searchAfter ? { search_after: searchAfter } : {}),
    });
    const hits = (response.hits.hits ?? []) as ProgramHit[];

    hits.forEach((hit) => {
      programs.push({
        id: String(hit._id ?? ""),
        name: firstText(hit._source?.name),
        institutions: institutionNames(hit._source?.orgUnit),
        publicationIds: hit.fields?.["publication.id"] ?? [],
      });
    });

    if (hits.length < BATCH_SIZE) break;
    searchAfter = hits[hits.length - 1].sort;
  }

  return programs;
}
