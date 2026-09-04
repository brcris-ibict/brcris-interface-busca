import ElasticsearchAPIConnector from "@elastic/search-ui-elasticsearch-connector";
import type { NextApiRequest, NextApiResponse } from "next";
import { createSearchUiTransporter } from "../../services/ElasticsearchSearchUiTransporter";

function builConnector(index: string) {
  const connector = new ElasticsearchAPIConnector({
    apiClient: createSearchUiTransporter(index),
    index,
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
