/* eslint-disable @typescript-eslint/ban-ts-comment */
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
    const { advisorId } = req.query as { advisorId: string };

    if (!advisorId) {
      return res.status(400).json({ error: "advisorId é obrigatório" });
    }

    // 🔍 Busca publicações com este orientador
    const pubs = await client.search({
      index: process.env.INDEX_PUBLICATION || "",
      size: 1000,
      body: {
        query: {
          term: { "advisor.id": advisorId },
        },
        _source: ["id", "title", "type", "advisor", "author"],
      },
    });

    const hits = pubs.body.hits.hits;
    if (!hits.length) {
      return res.json({ id: advisorId, advisees: [] });
    }

    const first = hits[0]._source;
    const advisorName = first?.advisor?.[0]?.name?.[0] ?? "Desconhecido";

    const advisees: any[] = [];

    hits.forEach((hit: any) => {
      const pub = hit._source;
      const thesisType = Array.isArray(pub.type) ? pub.type[0] : pub.type;

      if (Array.isArray(pub.author)) {
        pub.author.forEach((a: any) => {
          const name = Array.isArray(a.name) ? a.name[0] : a.name;
          if (name) {
            advisees.push({
              id: a.id || pub.id,
              name,
              title: Array.isArray(pub.title) ? pub.title[0] : pub.title,
              type: thesisType,
            });
          }
        });
      }
    });

    res.json({
      id: advisorId,
      name: advisorName,
      advisees,
    });
  } catch (e: any) {
    console.error("Erro no /api/orientacoes:", e.message);
    res.status(500).json({ error: e.message });
  }
}
