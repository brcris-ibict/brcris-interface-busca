// Campos de filtro entram aqui conforme os selects do painel forem criados
export type PeopleDashboardFilters = Record<string, string>;

export type PeopleDashboardFilterOptions = Record<string, string[]>;

export type PeopleDashboardSummary = {
  total: number;
  withOrcid: number;
  withPublications: number;
  institutionsCount: number;
  inResearchGroup: number;
  groupLeaders: number;
};

export type PeopleByNationalityPoint = {
  nationality: string;
  count: number;
};

export type PublicationsByTypePoint = {
  type: string;
  count: number;
};

export type PeopleByAffiliationPoint = {
  rank: number;
  affiliation: string;
  count: number;
  share: number;
};

export type PeopleDashboardResponse = {
  summary: PeopleDashboardSummary;
  byNationality: PeopleByNationalityPoint[];
  researchersWithoutNationality: number;
  byPublicationType: PublicationsByTypePoint[];
  byAffiliation: PeopleByAffiliationPoint[];
};

export type PeopleDashboardErrorResponse = {
  error: string;
};
