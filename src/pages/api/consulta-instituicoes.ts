import type { NextApiRequest, NextApiResponse } from "next";
import { createElasticsearchClient } from "../../services/ElasticsearchClient";

const client = createElasticsearchClient();

type RelatedOrgUnit = {
  id?: unknown;
};

type Institution = {
  id?: unknown;
  name?: unknown;
  relatedOrgUnit?: RelatedOrgUnit | RelatedOrgUnit[];
};

function asString(value: unknown): string {
  if (Array.isArray(value)) return String(value[0] ?? "");
  if (value == null) return "";
  return String(value);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const { ids } = req.body as { ids: string[] };

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "IDs são obrigatórios" });
    }

    const response = await client.search<Institution>({
      index: process.env.INDEX_ORGUNIT || "",
      size: 1000,
      _source: ["id", "name", "relatedOrgUnit"],
      query: {
        bool: {
          should: [
            { terms: { "relatedOrgUnit.id.keyword": ids } },
            { terms: { "relatedOrgUnit.id": ids } },
          ],
          minimum_should_match: 1,
        },
      },
    });

    const hits = response.hits?.hits ?? [];
    const idSet = new Set(ids.map(String));
    const result: Record<string, { id: string; name: string }> = {};

    for (const hit of hits) {
      const org = hit._source;
      const institutionId = asString(org?.id) || hit._id || "";
      const institutionName = asString(org?.name);
      const related = Array.isArray(org?.relatedOrgUnit)
        ? org.relatedOrgUnit
        : org?.relatedOrgUnit
          ? [org.relatedOrgUnit]
          : [];

      for (const item of related) {
        const relatedId = asString(item?.id);
        if (relatedId && idSet.has(relatedId) && !result[relatedId]) {
          result[relatedId] = {
            id: institutionId,
            name: institutionName,
          };
        }
      }
    }

    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Erro ao buscar instituições das bibliotecas:", error);
    return res.status(500).json({ error: error.message });
  }
}
