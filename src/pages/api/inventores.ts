import { Client } from "es7";
import type { NextApiRequest, NextApiResponse } from "next";
import logger from "../../services/Logger";

// Tipos para inventores
interface InventorFull {
  id: string;
  name: string[];
}

interface InventorPartial {
  id: string;
  name: string[];
}

const client = new Client({
  maxRetries: 5,
  requestTimeout: 60000,
  sniffOnStart: true,
  node: process.env.HOST_ELASTIC,
  auth: {
    apiKey: process.env.API_KEY!,
  },
});

const patentInventorsProxy = async (
  req: NextApiRequest,
  res: NextApiResponse,
) => {
  try {
    const { patentId } = req.query as { patentId: string };

    if (!patentId) {
      return res.status(400).json({ error: "patentId is required" });
    }

    // 1️⃣ Buscar patente
    const patentResp = await client.search({
      index: "brc-nov2025-patent",
      _source: ["id", "inventor"],
      body: {
        query: { term: { id: patentId } },
      },
    });

    // @ts-expect-error
    const patentHits = patentResp.body.hits.hits.map((h) => h._source);
    if (!patentHits.length) {
      return res.status(404).json({ error: "Patent not found" });
    }

    const patent = patentHits[0];

    const inventorIds: string[] = Array.isArray(patent.inventor)
      ? patent.inventor.map((i: any) => (typeof i === "string" ? i : i.id))
      : [
          typeof patent.inventor === "string"
            ? patent.inventor
            : patent.inventor.id,
        ];

    if (!inventorIds.length) {
      return res.json({ inventorsFull: [], inventorsPartial: [] });
    }

    const inventorNameMap: Record<string, string[]> = {};
    if (Array.isArray(patent.inventor)) {
      patent.inventor.forEach((i: any) => {
        const id = typeof i === "string" ? i : i.id;
        const name = typeof i === "string" ? [i] : i.name || [];
        inventorNameMap[id] = name;
      });
    }

    const peopleResp = await client.search({
      index: "brc-nov2025-person",
      _source: ["id", "name"],
      body: {
        query: {
          terms: { id: inventorIds },
        },
      },
    });

    const peopleHits: InventorFull[] = peopleResp.body.hits.hits.map(
      (h: any) => h._source,
    );

    const peopleMap = new Map<string, InventorFull>(
      peopleHits.map((p) => [p.id, p]),
    );

    // 3️⃣ Separar inventores encontrados e não encontrados
    const inventorsFull: InventorFull[] = [];
    const inventorsPartial: InventorPartial[] = [];

    inventorIds.forEach((id) => {
      const person = peopleMap.get(id);
      if (person) {
        inventorsFull.push({
          id: person.id,
          name: person.name,
        });
      } else {
        inventorsPartial.push({
          id,
          name: inventorNameMap[id] || [],
        });
      }
    });

    res.json({ inventorsFull, inventorsPartial });
  } catch (err: any) {
    logger.error(err);
    res.status(400).json({ error: err.message });
  }
};

export default patentInventorsProxy;
