import type {
  SearchDriverOptions,
  SearchFieldConfiguration,
  SearchQuery,
} from "@elastic/search-ui";
import type { estypes } from "es8";

type QueryDslOperator = estypes.QueryDslOperator;
export type Author = {
  id: string;
  name?: string;
  idLattes?: string;
  nationality?: string;
};
export type OrgUnit = {
  id: string;
  name?: string;
};

export type Service = {
  id: string;
  title: string[];
};

export type Publisher = {
  id: string;
  name: string;
};

export type Conference = {
  id: string;
  name: string[];
};

export type ResearchArea = {
  id: string;
  name: string[];
};

export type IndicatorType = {
  key: string;
  doc_count: number;
};

export type MemberType = {
  name: string;
  image: string;
  lattes: string;
  period: string;
};

export interface CustomSearchQuery extends SearchQuery {
  operator: QueryDslOperator;
  index: string;
  advanced_fields?: Record<string, SearchFieldConfiguration>;
}

export interface CustomSearchDriverOptions extends SearchDriverOptions {
  searchQuery: CustomSearchQuery;
  advanced: boolean;
}

export type QueryItem = {
  field: string;
  operator?: string;
  value: string;
};
