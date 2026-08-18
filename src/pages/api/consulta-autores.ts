import type { NextApiRequest, NextApiResponse } from "next";
import { createElasticsearchClient } from "../../services/ElasticsearchClient";

const client = createElasticsearchClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const { ids } = req.body as { ids: string[] };

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "IDs são obrigatórios" });
    }

    const response = await client.search({
      index: process.env.INDEX_PERSON || "",
      size: 1000,
      _source: ["id", "lattesId", "brcrisId"],
      query: {
        terms: {
          id: ids,
        },
      },
    });

    const hits = response.hits?.hits ?? [];

    const result = hits.map((hit: any) => {
      const person = hit._source;

      return {
        id: person?.id,
        lattesId: person?.lattesId ?? null,
        brcrisId: person?.brcrisId ?? null,
      };
    });

    console.log("EXEMPLO PERSON:", result?.[0]);

    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Erro ao buscar person:", error);
    return res.status(500).json({ error: error.message });
  }
}
