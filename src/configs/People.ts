/* eslint-disable @typescript-eslint/ban-ts-comment */

import CustomResultViewPeople from "../components/customResultView/CustomResultViewPeople";
import DefaultQueryConfig from "../components/DefaultQueryConfig";
import PeopleIndicators from "../components/indicators/PeopleIndicators";
import type { CustomSearchDriverOptions } from "../types/Entities";
import type { Index, SortOptionsType } from "../types/Propos";
import indexes from "./Indexes";

const indexName = process.env.INDEX_PERSON || "";

const config: CustomSearchDriverOptions = {
  ...DefaultQueryConfig(),
  searchQuery: {
    operator: "OR",
    index: indexName,
    advanced_fields: {
      "affiliation.name_text": {},
    },
    search_fields: {
      name_text: {},
      orcid: {},
      lattesId: {},
      brcrisId: {},
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
      affiliation: {
        snippet: {},
      },
    },
    disjunctiveFacets: [],
    facets: {
      "affiliation.name": { type: "value" },
    },
  },
  autocompleteQuery: {
    results: {
      // @ts-expect-error foi adiciona o index aqui para não dar erro no autocomplete
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
    value: [],
  },
  {
    name: "Nome ASC",
    value: [
      {
        field: "name",
        direction: "asc",
      },
    ],
  },
  {
    name: "Nome DESC",
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
  customView: CustomResultViewPeople,
  indicators: PeopleIndicators,
};

export default index;
