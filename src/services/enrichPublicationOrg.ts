import type { Client } from "es8";

type OrgSource = {
  id?: string | string[];
  rorid?: string | string[];
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

export function collectOrgIds(value: unknown): string[] {
  const list = Array.isArray(value) ? value : value ? [value] : [];
  return list
    .map((item) => {
      const id = (item as { id?: string | string[] } | undefined)?.id;
      if (Array.isArray(id)) return firstNonEmpty(id);
      return String(id ?? "").trim();
    })
    .filter(Boolean);
}

export async function fetchOrgRorById(
  client: Client,
  orgIndex: string,
  orgIds: string[],
): Promise<Map<string, string>> {
  const rorByOrgId = new Map<string, string>();
  const uniqueIds = [...new Set(orgIds)].filter(Boolean);
  if (!orgIndex || uniqueIds.length === 0) return rorByOrgId;

  const chunkSize = 500;
  for (let offset = 0; offset < uniqueIds.length; offset += chunkSize) {
    const chunk = uniqueIds.slice(offset, offset + chunkSize);
    const response = await client.search({
      index: orgIndex,
      size: chunk.length,
      _source: ["id", "rorid"],
      query: {
        bool: {
          should: [{ ids: { values: chunk } }, { terms: { id: chunk } }],
          minimum_should_match: 1,
        },
      },
    });

    for (const hit of response.hits.hits) {
      const source = hit._source as OrgSource;
      const ror = firstNonEmpty(source.rorid);
      if (!ror) continue;
      rorByOrgId.set(hit._id, ror);
      const sourceId = Array.isArray(source.id) ? source.id[0] : source.id;
      if (sourceId) rorByOrgId.set(sourceId, ror);
    }
  }

  return rorByOrgId;
}

export function mapOrgRors(value: unknown, rorByOrgId: Map<string, string>): string {
  return collectOrgIds(value)
    .map((id) => rorByOrgId.get(id) || "")
    .filter(Boolean)
    .join("|");
}
