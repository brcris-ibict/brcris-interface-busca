import type { NextApiRequest, NextApiResponse } from "next";
import { createElasticsearchClient } from "../../services/ElasticsearchClient";

const client = createElasticsearchClient();

type PersonReference = {
  id?: string;
  name?: string | string[];
};

type GuidancePublication = {
  id?: string;
  title?: string | string[];
  type?: string | string[];
  advisor?: PersonReference[];
  author?: PersonReference[];
};

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
    const pubs = await client.search<GuidancePublication>({
      index: process.env.INDEX_PUBLICATION || "",
      size: 1000,
      query: {
        term: { "advisor.id": advisorId },
      },
      _source: ["id", "title", "type", "advisor", "author"],
    });

    const hits = pubs.hits.hits;
    if (!hits.length) {
      return res.json({ id: advisorId, advisees: [] });
    }

    const first = hits[0]._source;
    let advisorName = "Desconhecido";

    if (first?.advisor) {
      const adv = first.advisor.find((a) => a.id === advisorId);
      if (adv) {
        advisorName = Array.isArray(adv.name)
          ? (adv.name[0] ?? advisorName)
          : (adv.name ?? advisorName);
      }
    }
    const advisees: any[] = [];

    hits.forEach((hit) => {
      const pub = hit._source;
      if (!pub) return;
      const thesisType = Array.isArray(pub.type) ? pub.type[0] : pub.type;

      if (Array.isArray(pub.author)) {
        pub.author.forEach((a) => {
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
