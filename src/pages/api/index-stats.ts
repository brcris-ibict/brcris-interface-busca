import { Client } from "es7";
import type { NextApiRequest, NextApiResponse } from "next";

export type IndexStats = {
  health: string;
  status: string;
  index: string;
  "docs.count": string;
  "docs.deleted": string;
  "store.size": string;
};

const client = new Client({
  maxRetries: 5,
  requestTimeout: 60000,
  sniffOnStart: true,
  node: process.env.HOST_ELASTIC,
  auth: {
    apiKey: process.env.API_KEY || "",
  },
});

const proxy = async (req: NextApiRequest, res: NextApiResponse) => {
  const { body } = await client.cat.indices({
    format: "json",
    index: req.query.indexesName,
  });

  const filteredData = body.map((item: IndexStats) => ({
    health: item.health,
    status: item.status,
    index: item.index,
    "docs.count": item["docs.count"],
    "docs.deleted": item["docs.deleted"],
    "store.size": item["store.size"],
  }));

  res.json(filteredData.length === 1 ? filteredData[0] : filteredData);
};

export default proxy;
