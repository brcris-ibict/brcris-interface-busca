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
  summary: PublicationsDashboardSummary;
  annual: PublicationsByYearPoint[];
  annualByType: PublicationsAnnualByTypePoint[];
  byType: PublicationsByTypePoint[];
  byLanguage: PublicationsByLanguagePoint[];
  byInstitution: PublicationsByInstitutionPoint[];
  topJournalsArticles: PublicationsTopJournalsArticles;
  filterOptions: PublicationsDashboardFilterOptions;
};

export type PublicationsDashboardErrorResponse = {
  error: string;
};
