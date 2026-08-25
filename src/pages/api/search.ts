import ElasticsearchAPIConnector from "@elastic/search-ui-elasticsearch-connector";
import type { NextApiRequest, NextApiResponse } from "next";
import type { estypes } from "es8";
import {
  excludeOrgLibraries,
  isOrgUnitIndex,
  shouldExcludeOrgLibraries,
  stripExcludeLibrariesFilter,
} from "../../lib/orgunitSearchQuery";
import {
  excludePublicationsWithMultipleTypes,
  isPublicationIndex,
} from "../../lib/publicationSearchQuery";
import ElasticsearchQueryBuilder from "../../services/ElasticsearchQueryBuilder";
import { createSearchUiTransporter } from "../../services/ElasticsearchSearchUiTransporter";
import logger from "../../services/Logger";
import type { CustomSearchQuery } from "../../types/Entities";

// https://docs.elastic.co/search-ui/api/connectors/elasticsearch#customise-the-elasticsearch-request-body
function builConnector(index: string) {
  const connector = new ElasticsearchAPIConnector({
    apiClient: createSearchUiTransporter(index),
    index,
    interceptSearchRequest: (
      { requestBody, requestState, queryConfig },
      next,
    ) => {
      const interceptedRequestBody = {
        ...requestBody,
        track_total_hits: true,
      };

      if (requestState.searchTerm) {
        const searchTerm = requestState.searchTerm.replaceAll(": ", " ");
        const searchFields: object = queryConfig.search_fields!;
        const fullQuery = new ElasticsearchQueryBuilder().format(
          searchTerm,
          Object.keys(searchFields),
        ) as estypes.QueryDslQueryContainer;
        console.log("fullQuery", JSON.stringify(fullQuery));
        interceptedRequestBody.query = fullQuery;
      }

      if (isPublicationIndex(index)) {
        interceptedRequestBody.query = excludePublicationsWithMultipleTypes(
          interceptedRequestBody.query,
        );
      }

      if (isOrgUnitIndex(index)) {
        interceptedRequestBody.query = stripExcludeLibrariesFilter(
          interceptedRequestBody.query,
        );
        if (shouldExcludeOrgLibraries(requestState.filters)) {
          interceptedRequestBody.query = excludeOrgLibraries(
            interceptedRequestBody.query,
          );
        }
      }

      return next(interceptedRequestBody);
    },
  });
  return connector;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const { requestState, queryConfig: rawQueryConfig } = req.body;
    const queryConfig = rawQueryConfig as CustomSearchQuery;

    if (
      !requestState.searchTerm &&
      (!requestState.filters || requestState.filters.length === 0)
    ) {
      return res
        .status(400)
        .json({ error: "Search term or filters are required" });
    }

    const connector = builConnector(queryConfig.index);

    const response = await connector.onSearch(requestState, queryConfig);
    res.json(response);
  } catch (err) {
    logger.error("ERROR::", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(400).json({ error: message });
  }
}
