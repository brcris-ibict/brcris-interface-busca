import type { Client } from "es8";
import { entityLabel, firstId, sanitizeExportText } from "./JsonToCsv";
import { normalizeLattesId } from "../../utils/Utils";

type PersonSource = {
  id?: string | string[];
  name?: unknown;
  orcid?: string | string[];
  citationName?: unknown;
  alternateName?: unknown;
  affiliation?: unknown;
  lattesId?: unknown;
  lattesShortId?: unknown;
};

export type PersonCsvFields = {
  id: string;
  name: string;
  citationName: string;
  alternateName: string;
  orcid: string;
  lattes_id: string;
  affiliation: string;
  affiliation_id: string;
  affiliation_ror: string;
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

function joinNames(value: unknown, delimiter: string): string {
  const list = Array.isArray(value) ? value : value ? [value] : [];
  return list
    .map((item) => {
      if (typeof item === "object" && item !== null) {
        return entityLabel(item);
      }
      return sanitizeExportText(String(item ?? "").trim());
    })
    .filter(Boolean)
    .join(delimiter);
}

function getAuthorId(item: unknown): string {
  const id = (item as { id?: string | string[] } | undefined)?.id;
  if (Array.isArray(id)) return firstNonEmpty(id);
  return String(id ?? "").trim();
}

export function emptyPersonFields(id: string, name = ""): PersonCsvFields {
  return {
    id,
    name,
    citationName: "",
    alternateName: "",
    orcid: "",
    lattes_id: "",
    affiliation: "",
    affiliation_id: "",
    affiliation_ror: "",
  };
}

export function collectPersonIdsFromHits(
  hits: Array<{ _source?: Record<string, unknown> }>,
): string[] {
  const ids: string[] = [];
  for (const hit of hits) {
    const source = hit._source || {};
    for (const field of ["author", "advisor", "coadvisor"]) {
      const value = source[field];
      const list = Array.isArray(value) ? value : value ? [value] : [];
      for (const item of list) {
        const id = getAuthorId(item);
        if (id) ids.push(id);
      }
    }
  }
  return ids;
}

export function collectAffiliationIds(
  peopleById: Map<string, PersonCsvFields>,
): string[] {
  return [...peopleById.values()].flatMap((person) =>
    person.affiliation_id.split("|").filter(Boolean),
  );
}

export function applyAffiliationRor(
  peopleById: Map<string, PersonCsvFields>,
  rorByOrgId: Map<string, string>,
): void {
  for (const person of peopleById.values()) {
    person.affiliation_ror = person.affiliation_id
      .split("|")
      .map((id) => rorByOrgId.get(id) || "")
      .filter(Boolean)
      .join("|");
  }
}

export async function fetchPersonCsvFieldsById(
  client: Client,
  personIndex: string,
  personIds: string[],
): Promise<Map<string, PersonCsvFields>> {
  const byPersonId = new Map<string, PersonCsvFields>();
  const uniqueIds = [...new Set(personIds)].filter(Boolean);
  if (!personIndex || uniqueIds.length === 0) return byPersonId;

  const chunkSize = 500;
  for (let offset = 0; offset < uniqueIds.length; offset += chunkSize) {
    const chunk = uniqueIds.slice(offset, offset + chunkSize);
    const response = await client.search({
      index: personIndex,
      size: chunk.length,
      _source: [
        "id",
        "name",
        "orcid",
        "citationName",
        "alternateName",
        "affiliation",
        "lattesId",
        "lattesShortId",
      ],
      query: {
        bool: {
          should: [{ ids: { values: chunk } }, { terms: { id: chunk } }],
          minimum_should_match: 1,
        },
      },
    });

    for (const hit of response.hits.hits) {
      const source = hit._source as PersonSource;
      const sourceId =
        (Array.isArray(source.id) ? source.id[0] : source.id) || hit._id;
      const affiliation = Array.isArray(source.affiliation)
        ? source.affiliation
        : source.affiliation
          ? [source.affiliation]
          : [];
      const fields: PersonCsvFields = {
        id: String(sourceId),
        name: joinNames(source.name, "|"),
        citationName: joinNames(source.citationName, "|"),
        alternateName: joinNames(source.alternateName, "|"),
        orcid: firstNonEmpty(source.orcid),
        lattes_id:
          normalizeLattesId(source.lattesId) ||
          normalizeLattesId(source.lattesShortId),
        affiliation: joinNames(affiliation, "|"),
        affiliation_id: affiliation
          .map((item) => firstId((item as { id?: unknown })?.id))
          .filter(Boolean)
          .join("|"),
        affiliation_ror: "",
      };
      byPersonId.set(hit._id, fields);
      if (sourceId) byPersonId.set(String(sourceId), fields);
    }
  }

  return byPersonId;
}
