import type { Client } from "es7";

type JournalSource = {
  id?: string | string[];
  issn?: string | string[];
  issn_l?: string | string[];
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

function collectJournalIds(source: Record<string, unknown>): string[] {
  const journal = source.journal;
  const list = Array.isArray(journal) ? journal : journal ? [journal] : [];
  return list
    .map((item) => {
      const id = (item as { id?: string | string[] } | undefined)?.id;
      if (Array.isArray(id)) return id[0];
      return id;
    })
    .filter((id): id is string => Boolean(id));
}

function collectIssnValues(value: unknown): string[] {
  const list = Array.isArray(value) ? value : value ? [value] : [];
  return list
    .map((item) => String(item ?? "").trim())
    .filter(Boolean);
}

function pickIssn(source: JournalSource | undefined): string {
  if (!source) return "";
  return [
    ...new Set([
      ...collectIssnValues(source.issn),
      ...collectIssnValues(source.issn_l),
    ]),
  ].join(",");
}

export function issnIsEmpty(value: unknown): boolean {
  return !firstNonEmpty(value);
}

export function collectJournalIdsFromHits(
  hits: Array<{ _source?: Record<string, unknown> }>,
): string[] {
  return hits.flatMap((hit) => collectJournalIds(hit._source || {}));
}

export async function fetchJournalIssnById(
  client: Client,
  journalIndex: string,
  journalIds: string[],
): Promise<Map<string, string>> {
  const issnByJournalId = new Map<string, string>();
  const uniqueIds = [...new Set(journalIds)].filter(Boolean);
  if (!journalIndex || uniqueIds.length === 0) return issnByJournalId;

  const chunkSize = 500;
  for (let offset = 0; offset < uniqueIds.length; offset += chunkSize) {
    const chunk = uniqueIds.slice(offset, offset + chunkSize);
    const response = await client.search({
      index: journalIndex,
      size: chunk.length,
      _source: ["id", "issn", "issn_l"],
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
      const source = hit._source as JournalSource;
      const issn = pickIssn(source);
      if (!issn) continue;
      issnByJournalId.set(hit._id, issn);
      const sourceId = Array.isArray(source.id) ? source.id[0] : source.id;
      if (sourceId) issnByJournalId.set(sourceId, issn);
    }
  }

  return issnByJournalId;
}

export function applyJournalIssn(
  source: Record<string, unknown>,
  issnByJournalId: Map<string, string>,
): void {
  if (!issnIsEmpty(source.issn)) return;
  const issns = [
    ...new Set(
      collectJournalIds(source)
        .map((id) => issnByJournalId.get(id))
        .filter((issn): issn is string => Boolean(issn)),
    ),
  ];
  if (issns.length) {
    source.issn = issns;
  }
}
