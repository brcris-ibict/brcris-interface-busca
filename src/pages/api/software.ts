import type { NextApiRequest, NextApiResponse } from "next";
import { createElasticsearchClient } from "../../services/ElasticsearchClient";
import logger from "../../services/Logger";

const client = createElasticsearchClient();

type Software = {
  id?: string;
  title?: string | string[];
};

const softwareProxy = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { softwareId } = req.query as { softwareId: string };

    if (!softwareId) {
      return res.status(400).json({ error: "softwareId is required" });
    }

    const response = await client.search<Software>({
      index: process.env.INDEX_SOFTWARE || "",
      _source: ["id", "title"],
      query: {
        match: {
          id: softwareId,
        },
      },
    });

    const hits = response.hits.hits.flatMap((hit) =>
      hit._source ? [hit._source] : [],
    );

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
