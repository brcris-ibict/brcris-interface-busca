import type { Client } from "es7";

type PersonSource = {
  id?: string | string[];
  orcid?: string | string[];
};

function firstNonEmpty(value: unknown): string {
  if (Array.isArray(value)) {
    for (const item of value) {
      const text = String(item ?? "").trim();
      if (text) return text;
    }
    return "";
  }
  return String(value ?? "").trim();
}

function collectAuthorIds(source: Record<string, unknown>): string[] {
  const author = source.author;
  const list = Array.isArray(author) ? author : author ? [author] : [];
  return list
    .map((item) => {
      const id = (item as { id?: string | string[] } | undefined)?.id;
      if (Array.isArray(id)) return id[0];
      return id;
    })
    .filter((id): id is string => Boolean(id));
}

export function collectAuthorIdsFromHits(
  hits: Array<{ _source?: Record<string, unknown> }>,
): string[] {
  return hits.flatMap((hit) => collectAuthorIds(hit._source || {}));
}

export async function fetchPersonOrcidById(
  client: Client,
  personIndex: string,
  personIds: string[],
): Promise<Map<string, string>> {
  const orcidByPersonId = new Map<string, string>();
  const uniqueIds = [...new Set(personIds)].filter(Boolean);
  if (!personIndex || uniqueIds.length === 0) return orcidByPersonId;

  const chunkSize = 500;
  for (let offset = 0; offset < uniqueIds.length; offset += chunkSize) {
    const chunk = uniqueIds.slice(offset, offset + chunkSize);
    const response = await client.search({
      index: personIndex,
      size: chunk.length,
      _source: ["id", "orcid"],
      body: {
        query: {
          bool: {
            should: [{ ids: { values: chunk } }, { terms: { id: chunk } }],
            minimum_should_match: 1,
          },
        },
      },
    });

    for (const hit of response.body.hits.hits) {
      const source = hit._source as PersonSource;
      const orcid = firstNonEmpty(source.orcid);
      if (!orcid) continue;
      orcidByPersonId.set(hit._id, orcid);
      const sourceId = Array.isArray(source.id) ? source.id[0] : source.id;
      if (sourceId) orcidByPersonId.set(sourceId, orcid);
    }
  }

  return orcidByPersonId;
}

export function applyAuthorOrcid(
  source: Record<string, unknown>,
  orcidByPersonId: Map<string, string>,
): void {
  const orcids = collectAuthorIds(source).map(
    (id) => orcidByPersonId.get(id) || "",
  );
  if (orcids.some(Boolean)) {
    source.orcid = orcids;
  }
}
