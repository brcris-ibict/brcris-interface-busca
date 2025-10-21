import ElasticsearchAPIConnector from "@elastic/search-ui-elasticsearch-connector";
import type { NextApiRequest, NextApiResponse } from "next";

function builConnector(index: string) {
  const connector = new ElasticsearchAPIConnector({
    host: process.env.HOST_ELASTIC,
    index: index,
    apiKey: process.env.API_KEY,
  });
  return connector;
}
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { requestState, queryConfig } = req.body;
  const connector = builConnector(queryConfig.index);
  const response = await connector.onAutocomplete(requestState, queryConfig);
  res.json(response);
}
