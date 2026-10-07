import type { PublicationsDashboardFilters } from "./PublicationsDashboard";

export type KnowledgeAreaItem = {
  name: string;
  count: number;
  isOther: boolean;
  groupedNames: string[];
};

export type KnowledgeAreasResponse = {
  level: 1 | 2;
  parent: string | null;
  totalWithArea: number;
  // Filtros ativos que o cadastro de pesquisadores não permite aplicar (ex.: idioma)
  ignoredFilters: (keyof PublicationsDashboardFilters)[];
  items: KnowledgeAreaItem[];
};

export type KnowledgeAreasErrorResponse = {
  error: string;
};
