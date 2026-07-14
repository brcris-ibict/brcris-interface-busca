import type { estypes } from "@elastic/elasticsearch";
import type { Filter } from "@elastic/search-ui";

export const ORG_LIBRARY_TYPE = "Biblioteca";
export const EXCLUDE_LIBRARIES_FILTER_FIELD = "excludeLibraries";

const LIBRARY_EXCLUSION: estypes.QueryDslQueryContainer = {
  term: { type: ORG_LIBRARY_TYPE },
};

function asList<T>(value: T | T[] | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function stripExcludeLibrariesFromClause(
  clause: estypes.QueryDslQueryContainer,
): estypes.QueryDslQueryContainer | null {
  if (clause.terms && EXCLUDE_LIBRARIES_FILTER_FIELD in clause.terms) {
    return null;
  }
  if (clause.term && EXCLUDE_LIBRARIES_FILTER_FIELD in clause.term) {
    return null;
  }
  return clause;
}

/** Remove o filtro artificial `excludeLibraries` do corpo da query. */
export function stripExcludeLibrariesFilter(
  query: estypes.QueryDslQueryContainer | undefined,
): estypes.QueryDslQueryContainer | undefined {
  if (!query?.bool) return query;

  const nextBool = { ...query.bool };

  for (const key of ["filter", "must", "should", "must_not"] as const) {
    const clauses = asList(nextBool[key]);
    if (clauses.length === 0) continue;
    const cleaned = clauses
      .map(stripExcludeLibrariesFromClause)
      .filter((c): c is estypes.QueryDslQueryContainer => c !== null);
    if (cleaned.length === 0) {
      delete nextBool[key];
    } else {
      nextBool[key] = cleaned.length === 1 ? cleaned[0] : cleaned;
    }
  }

  return { bool: nextBool };
}

export function excludeOrgLibraries(
  query: estypes.QueryDslQueryContainer | undefined,
): estypes.QueryDslQueryContainer {
  if (!query || Object.keys(query).length === 0) {
    return { bool: { must_not: [LIBRARY_EXCLUSION] } };
  }

  if (query.bool) {
    const mustNotList = asList(query.bool.must_not);
    return {
      bool: {
        ...query.bool,
        must_not: [...mustNotList, LIBRARY_EXCLUSION],
      },
    };
  }

  return {
    bool: {
      must: [query],
      must_not: [LIBRARY_EXCLUSION],
    },
  };
}

export function shouldExcludeOrgLibraries(
  filters: Filter[] | undefined,
): boolean {
  // Página de detalhe busca por _id — nunca ocultar o registro.
  const isDetailLookup = filters?.some((f) => f.field === "_id");
  if (isDetailLookup) return false;

  const typeFilter = filters?.find((f) => f.field === "type");
  const selectingLibrary =
    typeFilter?.type !== "none" &&
    typeFilter?.values?.some((value) => {
      const text = typeof value === "string" ? value : String(value);
      return text === ORG_LIBRARY_TYPE;
    });

  if (selectingLibrary) return false;

  return Boolean(
    filters?.some(
      (f) =>
        f.field === EXCLUDE_LIBRARIES_FILTER_FIELD &&
        f.values?.some((value) => String(value) === "true"),
    ),
  );
}

export function isOrgUnitIndex(index: string | undefined): boolean {
  return Boolean(index && index === process.env.INDEX_ORGUNIT);
}
