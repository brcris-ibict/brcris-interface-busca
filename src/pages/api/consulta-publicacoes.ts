import { Client } from "es7";
import type { NextApiRequest, NextApiResponse } from "next";

const client = new Client({
  node: process.env.HOST_ELASTIC,
  auth: { apiKey: process.env.API_KEY! },
});

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
      index: process.env.INDEX_PUBLICATION || "",
      size: 1000,
      _source: ["id", "publicationDate"],
      body: {
        query: {
          terms: {
            id: ids,
          },
        },
      },
    });

    const hits = response.body.hits?.hits ?? [];
    console.log("EXEMPLO DOC:", hits[0]?._source);
    const result = hits.map((hit: any) => {
      const pub = hit._source;

      const rawDate = pub?.publicationDate;

      let year: string | null = null;

      if (Array.isArray(rawDate) && rawDate.length > 0) {
        const first = rawDate[0];

        if (typeof first === "string" && first.length >= 4) {
          year = first.slice(0, 4);
        }
      } else if (typeof rawDate === "string" && rawDate.length >= 4) {
        year = rawDate.slice(0, 4);
      }
      return {
        id: pub.id,
        year,
      };
    });

    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Erro ao buscar anos por IDs:", error);
    return res.status(500).json({ error: error.message });
  }
}
