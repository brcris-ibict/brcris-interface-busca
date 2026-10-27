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

export type PeopleSpecializationPoint = {
  institution: string;
  majorArea: string;
  count: number;
};

export type PeopleSpecializationHeatmap = {
  institutions: string[];
  majorAreas: string[];
  matrix: [number, number, number][]; // [institutionIndex, majorAreaIndex, count]
  items: PeopleSpecializationPoint[];
};

export type PeopleIdentifiersMatrix = {
  both: number;
  orcidOnly: number;
  lattesOnly: number;
  none: number;
};

export type ActiveResearchersByYearPoint = {
  year: string;
  count: number;
};

export type PeopleDashboardResponse = {
  summary: PeopleDashboardSummary;
  byNationality: PeopleByNationalityPoint[];
  researchersWithoutNationality: number;
  byPublicationType: PublicationsByTypePoint[];
  byAffiliation: PeopleByAffiliationPoint[];
  identifiers: PeopleIdentifiersMatrix;
  activeResearchersByYear: ActiveResearchersByYearPoint[];
};

export type PublishersListItem = {
  id: string;
  name: string;
  publications: number;
  mainAffiliation: string;
  majorArea: string;
  lattesId: string;
  orcid: string;
  lastPublication: string;
  firstPublication: string;
};

export type PublishersListResponse = {
  items: PublishersListItem[];
  page: number;
  pageSize: number;
  total: number;
};

export type PeopleDashboardErrorResponse = {
  error: string;
};
