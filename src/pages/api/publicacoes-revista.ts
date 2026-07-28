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
      index: process.env.INDEX_JOURNAL || "",
      size: 1000,
      body: {
        query: {
          terms: {
            "publication.id": ids,
          },
        },
        _source: ["id", "title", "publication"],
      },
    });

    const journals = response.body.hits.hits.flatMap((hit: any) => {
      const journal = hit._source;

      return journal.publication
        .filter((pub: any) => ids.includes(pub.id))
        .map((pub: any) => ({
          id: pub.id,
          journal: journal.title?.[0] ?? "",
        }));
    });

    res.status(200).json(journals);
  } catch (error: any) {
    console.error("Erro ao buscar revistas:", error);
    res.status(500).json({ error: error.message });
  }
}
