import type { Client } from "es8";

type JournalSource = {
  id?: string | string[];
  issn?: string | string[];
  issn_l?: string | string[];
  eissn?: string | string[];
  eISSN?: string | string[];
};

export type JournalIdentifiers = {
  issn: string;
  issn_l: string;
  eissn: string;
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
  return list.map((item) => String(item ?? "").trim()).filter(Boolean);
}

function uniqueJoin(values: string[]): string {
  return [...new Set(values)].join("|");
}

export function issnIsEmpty(value: unknown): boolean {
  return !firstNonEmpty(value);
}

export function collectJournalIdsFromHits(
  hits: Array<{ _source?: Record<string, unknown> }>,
): string[] {
  return hits.flatMap((hit) => collectJournalIds(hit._source || {}));
}

export async function fetchJournalIdentifiersById(
  client: Client,
  journalIndex: string,
  journalIds: string[],
): Promise<Map<string, JournalIdentifiers>> {
  const byJournalId = new Map<string, JournalIdentifiers>();
  const uniqueIds = [...new Set(journalIds)].filter(Boolean);
  if (!journalIndex || uniqueIds.length === 0) return byJournalId;

  const chunkSize = 500;
  for (let offset = 0; offset < uniqueIds.length; offset += chunkSize) {
    const chunk = uniqueIds.slice(offset, offset + chunkSize);
    const response = await client.search({
      index: journalIndex,
      size: chunk.length,
      _source: ["id", "issn", "issn_l", "eissn", "eISSN"],
      query: {
        bool: {
          should: [{ ids: { values: chunk } }, { terms: { id: chunk } }],
          minimum_should_match: 1,
        },
      },
    });

    for (const hit of response.hits.hits) {
      const source = hit._source as JournalSource;
      const identifiers: JournalIdentifiers = {
        issn: uniqueJoin(collectIssnValues(source.issn)),
        issn_l: uniqueJoin(collectIssnValues(source.issn_l)),
        eissn: uniqueJoin(
          collectIssnValues(source.eissn ?? source.eISSN),
        ),
      };
      if (!identifiers.issn && !identifiers.issn_l && !identifiers.eissn) {
        continue;
      }
      byJournalId.set(hit._id, identifiers);
      const sourceId = Array.isArray(source.id) ? source.id[0] : source.id;
      if (sourceId) byJournalId.set(sourceId, identifiers);
    }
  }

  return byJournalId;
}

export function applyJournalIdentifiers(
  source: Record<string, unknown>,
  byJournalId: Map<string, JournalIdentifiers>,
): void {
  const issns: string[] = [];
  const issnLs: string[] = [];
  const eissns: string[] = [];
  for (const id of collectJournalIds(source)) {
    const found = byJournalId.get(id);
    if (!found) continue;
    if (found.issn) issns.push(...found.issn.split("|"));
    if (found.issn_l) issnLs.push(...found.issn_l.split("|"));
    if (found.eissn) eissns.push(...found.eissn.split("|"));
  }
  if (issnIsEmpty(source.issn) && issns.length) {
    source.issn = uniqueJoin(issns);
  }
  if (issnIsEmpty(source.issn_l) && issnLs.length) {
    source.issn_l = uniqueJoin(issnLs);
  }
  if (issnIsEmpty(source.eissn) && eissns.length) {
    source.eissn = uniqueJoin(eissns);
  }
}
