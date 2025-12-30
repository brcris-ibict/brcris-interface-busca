/* eslint-disable @typescript-eslint/ban-ts-comment */

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

const patentProxy = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { patentId } = req.query as { patentId: string };

    if (!patentId) {
      return res.status(400).json({ error: "patentId is required" });
    }

    const response = await client.search({
      index: "brc-nov2025-patent",
      _source: ["id", "title"],
      body: {
        query: {
          match: {
            id: patentId,
          },
        },
      },
    });

    // @ts-expect-error
    const hits = response.body.hits.hits.map((h) => h._source);

    if (!hits.length) {
      return res.status(404).json({ error: "Patent not found" });
    }

    const patent = hits[0];

    const result = {
      id: patent.id,
      title: patent.title,
    };

    res.json(result);
  } catch (err: any) {
    logger.error(err);
    res.status(400).json({ error: err.message });
  }
};

export default patentProxy;
