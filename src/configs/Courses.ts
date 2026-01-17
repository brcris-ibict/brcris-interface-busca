/* eslint-disable @typescript-eslint/ban-ts-comment */

import CustomResultViewCourses from "../components/customResultView/CustomResultViewCourses";
import DefaultQueryConfig from "../components/DefaultQueryConfig";
import CoursesIndicators from "../components/indicators/CoursesIndicators";
import type { CustomSearchDriverOptions } from "../types/Entities";
import type { Index, SortOptionsType } from "../types/Propos";
import indexes from "./Indexes";

const indexName = process.env.INDEX_COURSE || "";
const config: CustomSearchDriverOptions = {
  ...DefaultQueryConfig(),
  searchQuery: {
    index: indexName,
    operator: "OR",
    advanced_fields: {
      degree: {},
      type: {},
      startDate: {},
      endDate: {},
      "program.name": {},
      "orgUnit.name": {},
    },
    search_fields: {
      name_text: {},
      "program.name_text": {},
      "orgUnit.name_text": {},
    },
    result_fields: {
      id: { raw: {} },
      name: {
        snippet: {
          size: 100,
          fallback: true,
        },
      },
      degree: { raw: {} },
      type: { raw: {} },
      startDate: { raw: {} },
      endDate: { raw: {} },
      program: { raw: [] },
      orgUnit: { raw: [] },
    },
    disjunctiveFacets: [
      "degree",
      "type",
      "startDate",
      "endDate",
      "program.name",
      "orgUnit.name",
    ],
    facets: {
      degree: { type: "value" },
      type: { type: "value" },
      startDate: { type: "value" },
      endDate: { type: "value" },
      "program.name": { type: "value" },
      "orgUnit.name": { type: "value" },
    },
  },
  autocompleteQuery: {
    results: {
      // @ts-expect-error search-ui aceita index em runtime
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
  {
    name: "Data Início ASC",
    label: "Data Início ASC",
    value: [
      {
        field: "startDate",
        direction: "asc",
      },
    ],
  },
  {
    name: "Data Início DESC",
    label: "Data Início DESC",
    value: [
      {
        field: "startDate",
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
  customView: CustomResultViewCourses,
  indicators: CoursesIndicators,
};

export default index;
