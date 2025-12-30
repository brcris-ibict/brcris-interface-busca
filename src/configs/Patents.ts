/* eslint-disable @typescript-eslint/ban-ts-comment */

import CustomResultViewPatents from "../components/customResultView/CustomResultViewPatents";
import DefaultQueryConfig from "../components/DefaultQueryConfig";
import PatentsIndicators from "../components/indicators/PatentsIndicators";
import type { CustomSearchDriverOptions } from "../types/Entities";
import type { Index, SortOptionsType } from "../types/Propos";
import indexes from "./Indexes";

const indexName = process.env.INDEX_PATENT || "";

const config: CustomSearchDriverOptions = {
  ...DefaultQueryConfig(),
  searchQuery: {
    index: indexName,
    operator: "OR",
    advanced_fields: {
      publicationDate: {},
      depositDate: {},
      kindCode: {},
      countryCode: {},
    },
    search_fields: {
      title_text: {},
      "inventor.name_text": {},
    },
    result_fields: {
      id: {
        raw: {},
      },
      title: {
        snippet: {
          size: 100,
          fallback: true,
        },
      },
      depositDate: {
        raw: {},
      },
      kindCode: {
        raw: {},
      },
      countryCode: {
        raw: {},
      },
      lattesTitle: {
        raw: [],
      },
      publicationDate: {
        raw: [],
      },
      inventor: {
        raw: [],
      },
    },
    disjunctiveFacets: [
      "countryCode",
      "publicationDate",
      "depositDate",
      "inventor",
      "title",
      "inventor.name",
    ],
    facets: {
      countryCode: { type: "value" },
      publicationDate: { type: "value" },
      depositDate: { type: "value" },
      "inventor.name": { type: "value" },
    },
  },
  autocompleteQuery: {
    results: {
      resultsPerPage: 5,
      search_fields: {
        title_suggest: {
          weight: 3,
        },
      },
      result_fields: {
        title: {
          snippet: {
            size: 100,
            fallback: true,
          },
        },
      },
    },
    suggestions: {
      types: {
        results: { fields: ["title_completion"] },
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
  customView: CustomResultViewPatents,
  indicators: PatentsIndicators,
};

export default index;
