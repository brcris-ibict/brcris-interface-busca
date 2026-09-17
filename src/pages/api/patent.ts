import type { NextApiRequest, NextApiResponse } from "next";
import { createElasticsearchClient } from "../../services/ElasticsearchClient";
import logger from "../../services/Logger";

const client = createElasticsearchClient();

type Patent = {
  id?: string;
  title?: string | string[];
};

const patentsByInventor = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { personId } = req.query as { personId: string };

    if (!personId) {
      return res.status(400).json({ error: "personId is required" });
    }

    const response = await client.search<Patent>({
      index: process.env.INDEX_PATENT || "",
      _source: ["id", "title"],
      query: {
        term: {
          "inventor.id": personId,
        },
      },
    });

    const hits = response.hits.hits.flatMap((hit) =>
      hit._source ? [hit._source] : [],
    );

    if (!hits.length) {
      return res.json([]);
    }

    const result = hits.map((p) => ({
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
