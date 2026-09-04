import type {
  IApiClientTransporter,
  ResponseBody,
  SearchRequest,
} from "@elastic/search-ui-elasticsearch-connector";
import { createElasticsearchClient } from "./ElasticsearchClient";

export function createSearchUiTransporter(
  index: string,
): IApiClientTransporter {
  const client = createElasticsearchClient();

  return {
    headers: {},
    async performRequest(requestBody: SearchRequest) {
      const response = await client.search({ ...requestBody, index });

      return response as unknown as ResponseBody;
    },
  };
}
