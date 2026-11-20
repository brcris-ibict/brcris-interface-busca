export type PatentsSummary = {
  total: number;
};

export type PatentsSummaryResponse = {
  summary: PatentsSummary;
};

export type PatentsDashboardErrorResponse = {
  error: string;
};

export type PatentKindPoint = {
  code: string;
  count: number;
};

export type PatentKindResponse = {
  items: PatentKindPoint[];
  total: number;
};

export type PatentIpcPoint = {
  rank: number;
  code: string;
  count: number;
};

export type PatentIpcResponse = {
  items: PatentIpcPoint[];
  withIpc: number;
  total: number;
};

export type PatentYearPoint = {
  year: number;
  deposits: number;
  granted: number;
};

export type PatentByYearResponse = {
  items: PatentYearPoint[];
  incompleteYear: number | null;
};

export type PatentListItem = {
  id: string;
  title: string;
  depositDate: string;
  kindCodes: string[];
  inventors: string;
  ipc: string;
  url: string;
};

export type PatentListResponse = {
  items: PatentListItem[];
  page: number;
  pageSize: number;
  total: number;
};
