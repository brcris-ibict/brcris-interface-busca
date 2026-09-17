import type { NextApiRequest, NextApiResponse } from "next";
import { createElasticsearchClient } from "../../services/ElasticsearchClient";
import logger from "../../services/Logger";

export type IndexStats = {
  health: string;
  status: string;
  index: string;
  "docs.count": string;
  "docs.deleted": string;
  "store.size": string;
};

const client = createElasticsearchClient();

function getElasticsearchStatusCode(error: unknown): number | undefined {
  if (!error || typeof error !== "object" || !("meta" in error)) {
    return undefined;
  }

  const meta = error.meta;

  if (!meta || typeof meta !== "object" || !("statusCode" in meta)) {
    return undefined;
  }

  return typeof meta.statusCode === "number" ? meta.statusCode : undefined;
}

const proxy = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const data = await client.cat.indices({
      format: "json",
      index: req.query.indexesName,
    });

    const filteredData = data.map((item: IndexStats) => ({
      health: item.health,
      status: item.status,
      index: item.index,
      "docs.count": item["docs.count"],
      "docs.deleted": item["docs.deleted"],
      "store.size": item["store.size"],
    }));

    return res.json(filteredData.length === 1 ? filteredData[0] : filteredData);
  } catch (error: unknown) {
    logger.error(error);

    const statusCode = getElasticsearchStatusCode(error);

    if (statusCode === 401 || statusCode === 403) {
      return res.status(statusCode).json({
        error:
          "Elasticsearch API key requires the index privilege 'monitor' to read index statistics",
      });
    }

    return res
      .status(502)
      .json({ error: "Unable to connect to Elasticsearch" });
  }
};

export default proxy;
