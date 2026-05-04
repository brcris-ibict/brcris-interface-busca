/** biome-ignore-all lint/suspicious/useIterableCallbackReturn: <explanation> */

import type { Filter, FilterValue } from "@elastic/search-ui";
import ElasticsearchQueryBuilder from "../../../services/ElasticsearchQueryBuilder";
import { untranslatedFieldsNames } from "../../SearchSanitization";

type QueryDslOperator = "AND" | "OR";
type QueryDslQueryContainer = Record<string, any>;
type QueryProps = {
  size: number;
  indicadorName: string;
  searchTerm: string;
  fields: string[];
  operator: QueryDslOperator;
  filters: Filter[];
  order?: { _count?: string; _key?: string };
};
export function getAggregateQuery({
  size = 10,
  indicadorName,
  searchTerm,
  fields,
  operator,
  filters,
  order = { _count: "desc" },
}: QueryProps) {
  try {
    const query: QueryDslQueryContainer = formatedQuery(
      searchTerm,
      fields,
      operator,
      filters,
    );
    return {
      track_total_hits: true,
      _source: [indicadorName],
      size: 0,
      aggs: {
        aggregate: {
          terms: {
            field: indicadorName,
            size: size,
            order: order,
          },
        },
      },
      query: query,
    };
  } catch (err) {
    throw err;
  }
}

export function formatedQuery(
  searchTerm: string,
  fields: string[],
  operator: QueryDslOperator,
  filters: Filter[],
): QueryDslQueryContainer {
  let query: QueryDslQueryContainer = {};
  if (searchTerm.indexOf("(") >= 0) {
    query = new ElasticsearchQueryBuilder().format(
      untranslatedFieldsNames(searchTerm),
      fields,
    ) as QueryDslQueryContainer;
  } else {
    query = {
      bool: {
        must: {
          query_string: {
            query: searchTerm || "*",
            default_operator: operator,
            fields: searchTerm ? fields : [],
          },
        },
      },
    };
  }
  query.bool!.filter =
    filters && filters.length > 0 ? getFormatedFilters(filters) : [];
  return query;
}

function getFormatedFilters(filters: Filter[]): any {
  const filterFormated: { terms: { [x: string]: FilterValue[] } }[] = [];
  filters.forEach((filter: Filter) => {
    if (filter.type === "none") {
      const matrix = filter.values.map((val: any) => val.split(" - "));
      const values = [].concat(...matrix);
      values.sort();
      const from = values[0];
      const to = values[values.length - 1];

      return {
        range: {
          [filter.field]: {
            gte: from,
            lte: to,
          },
        },
      };
    }
    filterFormated.push({ terms: { [filter.field]: filter.values } });
  });
  return filterFormated;
}
