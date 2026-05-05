/* eslint-disable @typescript-eslint/ban-ts-comment */

import CustomResultViewOrganizations from "../components/customResultView/CustomResultViewOrganizations";
import DefaultQueryConfig from "../components/DefaultQueryConfig";
import OrgUnitIndicators from "../components/indicators/OrgUnitIndicators";
import type { CustomSearchDriverOptions } from "../types/Entities";
import type { Index, SortOptionsType } from "../types/Propos";
import indexes from "./Indexes";

const indexName = process.env.INDEX_ORGUNIT || "";

const config: CustomSearchDriverOptions = {
  ...DefaultQueryConfig(),
  searchQuery: {
    index: indexName,
    operator: "OR",
    search_fields: {
      name_text: {
        weight: 3,
      },
      acronym: {},
      country: {},
      state: {},
      city: {},
    },
    result_fields: {
      id: {
        raw: {},
      },
      name: {
        snippet: {
          size: 100,
          fallback: true,
        },
      },
      acronym: {
        raw: {},
      },
      country: {
        raw: {},
      },
      state: {
        raw: {},
      },
      city: {
        raw: {},
      },
    },
    facets: {
      country: { type: "value" },
      state: { type: "value", size: 27 },
      city: { type: "value" },
    },
  },
  autocompleteQuery: {
    results: {
      // @ts-expect-error Search UI aceita index em runtime
      index: indexName,
      resultsPerPage: 5,
      search_fields: {
        name_suggest: {
          weight: 3,
        },
      },
      result_fields: {
        name: {
          snippet: {
            size: 100,
            fallback: true,
          },
        },
      },
    },
    suggestions: {
      types: {
        results: { fields: ["name_completion"] },
      },
      size: 5,
    },
  },
};

const sortOptions: SortOptionsType[] = [
  {
    name: "Relevance",
    label: "Relevance",
    value: [],
  },
  {
    name: "Nome ASC",
    label: "Nome ASC",
    value: [
      {
        field: "name",
        direction: "asc",
      },
    ],
  },
  {
    name: "Nome DESC",
    label: "Nome DESC",
    value: [
      {
        field: "name",
        direction: "desc",
      },
    ],
  },
];

const index: Index = {
  config,
  sortOptions,
  name: indexName,
  label: indexes.find((i) => i.name === indexName)?.label || "",
  customView: CustomResultViewOrganizations,
  indicators: OrgUnitIndicators,
};

export default index;
