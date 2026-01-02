import { Client } from "es7";
import type { NextApiRequest, NextApiResponse } from "next";
import logger from "../../services/Logger";

/**
 * Inventor COM perfil (existe no índice de pessoas)
 */
interface InventorFull {
  id: string;
  name: string[];
}

/**
 * Inventor SEM perfil (só existe na patente)
 */
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

    /**
     * 1️⃣ Buscar patente
     */
    const patentResp = await client.search({
      index: process.env.INDEX_PATENT || "",
      _source: ["id", "inventor"],
      body: {
        query: {
          term: { id: patentId },
        },
      },
    });

    // @ts-expect-error
    const patentHits = patentResp.body.hits.hits.map((h) => h._source);

    if (!patentHits.length) {
      return res.status(404).json({ error: "Patent not found" });
    }

    const patent = patentHits[0];

    /**
     * 2️⃣ Extrair IDs dos inventores
     */
    const inventorIds: string[] = Array.isArray(patent.inventor)
      ? patent.inventor.map((i: any) => i?.id).filter(Boolean)
      : patent.inventor?.id
        ? [patent.inventor.id]
        : [];

    if (!inventorIds.length) {
      return res.json({ inventorsFull: [], inventorsPartial: [] });
    }

    /**
     * 3️⃣ Mapear nomes vindos da patente
     * (usado quando NÃO existe perfil de pessoa)
     */
    const inventorNameMap: Record<string, string[]> = {};

    if (Array.isArray(patent.inventor)) {
      patent.inventor.forEach((i: any) => {
        if (i?.id && Array.isArray(i.name)) {
          inventorNameMap[i.id] = i.name;
        }
      });
    }

    /**
     * 4️⃣ Buscar pessoas no índice de pessoas
     */
    const peopleResp = await client.search({
      index: process.env.INDEX_PATENTEOPLE || "",
      _source: ["id", "name"],
      body: {
        query: {
          terms: { id: inventorIds },
        },
      },
    });

    const peopleHits: InventorFull[] =
      // @ts-expect-error
      peopleResp.body.hits.hits.map((h) => h._source);

    const peopleMap = new Map<string, InventorFull>(
      peopleHits.map((p) => [p.id, p]),
    );

    /**
     * 5️⃣ Separar inventores COM e SEM perfil
     */
    const inventorsFull: InventorFull[] = [];
    const inventorsPartial: InventorPartial[] = [];

    inventorIds.forEach((id) => {
      const person = peopleMap.get(id);

      const hasValidProfile =
        person &&
        Array.isArray(person.name) &&
        person.name.length > 0 &&
        person.id !== patent.id; // 🔴 REGRA CRÍTICA

      if (hasValidProfile) {
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

    /**
     * 6️⃣ Resposta final
     */
    return res.json({
      inventorsFull,
      inventorsPartial,
    });
  } catch (err: any) {
    logger.error(err);
    return res.status(500).json({
      error: err.message || "Internal server error",
    });
  }
};

export default patentInventorsProxy;
