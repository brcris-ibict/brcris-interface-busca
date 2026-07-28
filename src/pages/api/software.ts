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

const softwareProxy = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { softwareId } = req.query as { softwareId: string };

    if (!softwareId) {
      return res.status(400).json({ error: "softwareId is required" });
    }

    const response = await client.search({
      index: process.env.INDEX_SOFTWARE || "",
      _source: ["title"],
      body: {
        query: {
          match: {
            id: softwareId,
          },
        },
      },
    });

    // @ts-expect-error
    const hits = response.body.hits.hits.map((h) => h._source);

    if (!hits.length) {
      return res.status(404).json({ error: "Software not found" });
    }

    const software = hits[0];

    const result = {
      id: software.id,
      title: software.title,
    };

    res.json(result);
  } catch (err: any) {
    logger.error(err);
    res.status(400).json({ error: err.message });
  }
};

export default softwareProxy;
