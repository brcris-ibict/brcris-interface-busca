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

export type PeopleDashboardResponse = {
  summary: PeopleDashboardSummary;
};

export type PeopleDashboardErrorResponse = {
  error: string;
};
