import type { PublicationsDashboardFilters } from "./PublicationsDashboard";

export type KnowledgeAreaItem = {
  name: string;
  count: number;
  isOther: boolean;
  groupedNames: string[];
};

export type KnowledgeAreasResponse = {
  // updating = dados da versão anterior enquanto a nova é calculada
  status: "ready" | "updating" | "building";
  level: 1 | 2;
  parent: string | null;
  totalWithArea: number;
  generatedAt: string | null;
  // Filtro com valor fora da tabela fato (ex.: instituição fora das 100 maiores)
  unsupportedFilter: keyof PublicationsDashboardFilters | null;
  items: KnowledgeAreaItem[];
};

export type KnowledgeAreasErrorResponse = {
  error: string;
};
