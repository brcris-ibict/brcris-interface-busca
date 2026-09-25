/**
 * Paginação server-side reutilizável (dashboard).
 * A UI pede page/pageSize; a API devolve items da página + total global filtrado.
 */

export const SERVER_PAGE_DEFAULT_SIZE = 10;
// Tamanho máximo aceito por request de página (UI / lote de export)
export const SERVER_PAGE_MAX_SIZE = 100;
// Cap de buckets no terms aggregation (evita size ilimitado no ES)
export const SERVER_TERMS_FETCH_CAP = 10_000;
// Export: máximo de linhas no CSV (lotes; não um único pageSize=total)
export const SERVER_EXPORT_MAX_ROWS = 5_000;
export const SERVER_EXPORT_PAGE_SIZE = 100;
// Janela máxima from+size do Elasticsearch (padrão do índice)
export const SERVER_RESULT_WINDOW = 10_000;

export type ServerPaginatedResponse<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
};

// Converte query param em inteiro positivo com teto
export function parsePositiveInt(
  value: string | string[] | undefined,
  fallback: number,
  max: number,
) {
  const raw = typeof value === "string" ? Number(value) : NaN;

  if (!Number.isFinite(raw) || raw < 1) return fallback;

  return Math.min(Math.floor(raw), max);
}

// Monta query string page/pageSize + filtros (reuso em várias tabelas)
export function buildServerPageSearchParams(
  filters: Record<string, string | undefined | null>,
  page: number,
  pageSize: number,
  knownTotal?: number,
) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([field, value]) => {
    if (value) params.set(field, value);
  });

  params.set("page", String(page));
  params.set("pageSize", String(pageSize));

  if (knownTotal && knownTotal > 0) {
    params.set("knownTotal", String(knownTotal));
  }

  return params;
}

// Quantidade de buckets a pedir no terms para cobrir a página atual
export function termsFetchSize(page: number, pageSize: number, cap = SERVER_TERMS_FETCH_CAP) {
  return Math.min(page * pageSize, cap);
}

// Total navegável: não ultrapassa o que o terms consegue materializar
export function navigableTotal(cardinalityTotal: number, cap = SERVER_TERMS_FETCH_CAP) {
  const safe = Number.isFinite(cardinalityTotal) ? Math.max(0, Math.floor(cardinalityTotal)) : 0;
  return Math.min(safe, cap);
}
