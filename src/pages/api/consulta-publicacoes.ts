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
      index: process.env.INDEX_PUBLICATION || "",
      size: 1000,
      _source: ["id", "publicationDate", "author", "advisor"],
      query: {
        terms: {
          id: ids,
        },
      },
    });

    const hits = response.hits?.hits ?? [];
    const normalizeName = (person: any) => {
      if (!person) return "";
      if (typeof person === "string") return person;
      if (typeof person.name === "string") return person.name;
      if (typeof person.name?.raw === "string") return person.name.raw;
      if (Array.isArray(person.name) && person.name.length > 0) {
        return typeof person.name[0] === "string"
          ? person.name[0]
          : typeof person.name[0]?.raw === "string"
            ? person.name[0].raw
            : "";
      }
      return "";
    };

    const normalizePeople = (people: any) => {
      if (!people) return [];
      if (Array.isArray(people)) {
        return people.map(normalizeName).filter((name) => !!name);
      }
      const name = normalizeName(people);
      return name ? [name] : [];
    };

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
        authors: normalizePeople(pub.author),
        advisors: normalizePeople(pub.advisor),
      };
    });

    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Erro ao buscar anos por IDs:", error);
    return res.status(500).json({ error: error.message });
  }
}
