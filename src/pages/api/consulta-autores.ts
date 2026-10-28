import type { NextApiRequest, NextApiResponse } from "next";
import { createElasticsearchClient } from "../../services/ElasticsearchClient";

const client = createElasticsearchClient();

const PERSON_LOOKUP_CHUNK = 1000;

function uniqueIds(ids: string[]) {
  return [...new Set(ids.filter((id) => typeof id === "string" && id))];
}

async function searchPeople(ids: string[]) {
  const people = [];

  for (let offset = 0; offset < ids.length; offset += PERSON_LOOKUP_CHUNK) {
    const chunk = ids.slice(offset, offset + PERSON_LOOKUP_CHUNK);
    const response = await client.search({
      index: process.env.INDEX_PERSON || "",
      size: chunk.length,
      _source: ["id", "lattesId", "brcrisId"],
      query: {
        terms: {
          id: chunk,
        },
      },
    });

    for (const hit of response.hits?.hits ?? []) {
      const person = hit._source as {
        id?: string;
        lattesId?: string[] | null;
        brcrisId?: string | null;
      };

      people.push({
        id: person?.id,
        lattesId: person?.lattesId ?? null,
        brcrisId: person?.brcrisId ?? null,
      });
    }
  }

  return people;
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

    const result = await searchPeople(uniqueIds(ids));

    console.log("EXEMPLO PERSON:", result?.[0]);

    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Erro ao buscar person:", error);
    return res.status(500).json({ error: error.message });
  }
}
