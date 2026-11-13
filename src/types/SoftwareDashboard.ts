export type SoftwareSummary = {
  total: number;
  granted: number;
  medianConcessionDays: number | null;
  creators: number;
  avgCreatorsPerSoftware: number | null;
  funders: number;
  withFunding: number;
};

export type SoftwareSummaryResponse = {
  summary: SoftwareSummary;
};

export type SoftwareDashboardErrorResponse = {
  error: string;
};

export type SoftwareYearPoint = {
  year: number;
  count: number;
  deposits: number;
  granted: number;
};

export type SoftwareByYearResponse = {
  items: SoftwareYearPoint[];
  incompleteYear: number | null;
};

export type SoftwareLanguagePoint = {
  name: string;
  count: number;
};

export type SoftwareLanguagesResponse = {
  items: SoftwareLanguagePoint[];
  withLanguage: number;
  total: number;
};

export type SoftwareSectorLanguageCell = {
  sector: string;
  language: string;
  count: number;
};

export type SoftwareSectorLanguageResponse = {
  sectors: { name: string; total: number }[];
  languages: string[];
  cells: SoftwareSectorLanguageCell[];
  withSector: number;
  total: number;
};
