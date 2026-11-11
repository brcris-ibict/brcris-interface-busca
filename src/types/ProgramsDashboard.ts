export type ProgramsInstitutionPoint = {
  name: string;
  count: number;
};

export type ProgramsAreaPoint = {
  area: string;
  count: number;
  institutions: ProgramsInstitutionPoint[];
};

export type ProgramsAreaInstitutionResponse = {
  areas: ProgramsAreaPoint[];
};

export type ProgramsTermPoint = {
  name: string;
  count: number;
};

export type ProgramsTermsResponse = {
  items: ProgramsTermPoint[];
};

export type ProgramsSummary = {
  total: number;
  withDoctorate: number;
  networked: number;
};

export type ProgramsSummaryResponse = {
  summary: ProgramsSummary;
};

export type ProgramPublicationsRow = {
  rank: number;
  program: string;
  institution: string;
  publications: number;
};

export type ProgramPublicationsResponse = {
  items: ProgramPublicationsRow[];
};

export type ProgramListRow = {
  rank: number;
  id: string;
  name: string;
  institution: string;
};

export type ProgramListResponse = {
  items: ProgramListRow[];
};

export type ProgramsDashboardErrorResponse = {
  error: string;
};
