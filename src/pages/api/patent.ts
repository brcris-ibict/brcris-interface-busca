import { Client } from "es7";
import type { NextApiRequest, NextApiResponse } from "next";
import logger from "../../services/Logger";

const client = new Client({
  maxRetries: 5,
  requestTimeout: 60000,
  sniffOnStart: true,
  node: process.env.HOST_ELASTIC,
  auth: {
    apiKey: process.env.API_KEY!,
  },
});

const patentsByInventor = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { personId } = req.query as { personId: string };

    if (!personId) {
      return res.status(400).json({ error: "personId is required" });
    }

    const response = await client.search({
      index: process.env.INDEX_PATENT || "",
      _source: ["id", "title"],
      body: {
        query: {
          term: {
            "inventor.id": personId,
          },
        },
      },
    });

    // @ts-expect-error
    const hits = response.body.hits.hits.map((h) => h._source);

    if (!hits.length) {
      return res.json([]);
    }

    const result = hits.map((p: any) => ({
      id: p.id,
      title: p.title,
    }));

    res.json(result);
  } catch (err: any) {
    logger.error(err);
    res.status(400).json({ error: err.message });
  }
};

export default patentsByInventor;
