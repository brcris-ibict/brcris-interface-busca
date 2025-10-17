/* eslint-disable @typescript-eslint/ban-ts-comment */

import CustomResultViewPeople from "../components/customResultView/CustomResultViewPrograms";
import DefaultQueryConfig from "../components/DefaultQueryConfig";
import ProgramsIndicators from "../components/indicators/ProgramsIndicators";
import type { CustomSearchDriverOptions } from "../types/Entities";
import type { Index, SortOptionsType } from "../types/Propos";
import indexes from "./Indexes";

const indexName = process.env.INDEX_PROGRAM || "";

const config: CustomSearchDriverOptions = {
  ...DefaultQueryConfig(),
  searchQuery: {
    index: indexName,
    operator: "OR",
    search_fields: {
      name: {},
      "orgUnit.name_text": {},
    },
    result_fields: {
      name: {
        snippet: {
          size: 100,
          fallback: true,
        },
      },
      orgUnit: {
        raw: [],
      },
      researchArea: {
        raw: {},
      },
    },
    facets: {
      "researchArea.name": { type: "value" },
      "orgUnit.name": { type: "value" },
    },
  },
  autocompleteQuery: {
    results: {
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
      size: 4,
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
  indicators: ProgramsIndicators,
};

export default index;
