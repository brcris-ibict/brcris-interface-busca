import type { ServerPaginatedResponse } from "../lib/serverPagination";

export type PublicationsDashboardFilters = {
  publicationDate: string;
  type: string;
  language: string;
  institution: string;
};

export type PublicationsDashboardFilterOptions = {
  publicationDates: string[];
  types: string[];
  languages: string[];
  institutions: string[];
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

export type PublicationsByInstitutionPoint = {
  institution: string;
  count: number;
};

export type PublicationsAnnualByTypePoint = {
  year: string;
  types: PublicationsByTypePoint[];
};

export type PublicationsTopJournalPoint = {
  rank: number;
  journal: string;
  count: number;
  share: number;
};

export type PublicationsTopJournalsArticles = {
  totalArticles: number;
  items: PublicationsTopJournalPoint[];
};

export type PublicationsAuthorPoint = {
  rank: number;
  author: string;
  count: number;
};

export type PublicationsAuthors = {
  items: PublicationsAuthorPoint[];
};

export type PublicationsJournalQuantifierPoint = {
  rank: number;
  title: string;
  publications: number;
  conferences: number;
  journals: number;
  authors: number;
  sponsors: number;
};

export type PublicationsJournalQuantifiers =
  ServerPaginatedResponse<PublicationsJournalQuantifierPoint>;

export type PublicationsListItem = {
  id: string;
  title: string;
  authors: string;
  journal: string;
  conference: string;
  doi: string;
  accessType: string;
  funding: string;
};

export type PublicationsListResponse =
  ServerPaginatedResponse<PublicationsListItem>;

export type PublicationsKeywordPoint = {
  keyword: string;
  count: number;
};

export type PublicationsKeywordHeatmap = {
  items: PublicationsKeywordPoint[];
};

export type PublicationsDashboardSummary = {
  total: number;
  lastYear: string;
  lastYearCount: number;
  institutionsCount: number;
  predominantType: string;
  predominantTypeShare: number;
};

export type PublicationsDashboardResponse = {
  total: number;
  publicationsWithoutInstitution: number;
  publicationsWithoutLanguage: number;
  summary: PublicationsDashboardSummary;
  annual: PublicationsByYearPoint[];
  annualByType: PublicationsAnnualByTypePoint[];
  byType: PublicationsByTypePoint[];
  byLanguage: PublicationsByLanguagePoint[];
  byInstitution: PublicationsByInstitutionPoint[];
  topJournalsArticles: PublicationsTopJournalsArticles;
  authors: PublicationsAuthors;
  filterOptions: PublicationsDashboardFilterOptions;
};

export type PublicationsDashboardErrorResponse = {
  error: string;
};
