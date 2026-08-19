export type PublicationsDashboardFilters = {
  publicationDate: string;
  type: string;
  language: string;
};

export type PublicationsDashboardFilterOptions = {
  publicationDates: string[];
  types: string[];
  languages: string[];
};

export type PublicationsByYearPoint = {
  year: string;
  count: number;
};

export type PublicationsByTypePoint = {
  type: string;
  count: number;
};

export type PublicationsByLanguagePoint = {
  language: string;
  count: number;
};

export type PublicationsDashboardResponse = {
  total: number;
  annual: PublicationsByYearPoint[];
  byType: PublicationsByTypePoint[];
  byLanguage: PublicationsByLanguagePoint[];
  filterOptions: PublicationsDashboardFilterOptions;
};

export type PublicationsDashboardErrorResponse = {
  error: string;
};
