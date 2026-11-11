import type { PublicationsDashboardFilters } from "../types/PublicationsDashboard";

export const PUBLICATION_YEAR_FROM = 1960;

// Campos da busca textual. title/author.name são keyword (usados em aggs);
// o texto analisado fica em *_text (mesmo usado pela busca do portal em configs/Publications.ts).
// keywords/journal.title/conference.name são keyword: só casam com o valor exato.
export const PUBLICATION_SEARCH_FIELDS = [
  "title_text^3",
  "keywords^2",
  "author.name_text",
  "journal.title",
  "conference.name",
  "doi",
] as const;

// Filtros do painel (mesmo critério da API /publications)
export function buildPublicationFilterClauses(filters: PublicationsDashboardFilters) {
  const yearTo = String(new Date().getFullYear());
  const clauses: Record<string, unknown>[] = [
    {
      range: {
        publicationDate: { gte: String(PUBLICATION_YEAR_FROM), lte: yearTo },
      },
    },
  ];

  // Filtros de data, tipo, idioma, instituição
  if (filters.publicationDate) {
    clauses.push({ term: { publicationDate: filters.publicationDate } });
  }
  if (filters.type) {
    clauses.push({ term: { type: filters.type } });
  }
  if (filters.language) {
    clauses.push({ term: { language: filters.language } });
  }
  if (filters.institution) {
    clauses.push({ term: { "sponsorOrgUnit.name": filters.institution } });
  }

  return clauses;
}

// Campos que guardam o valor exato; no simple_query_string eles diferenciam maiúsculas
const EXACT_VALUE_FIELDS = [
  { field: "keywords", boost: 2 },
  { field: "journal.title", boost: 1 },
  { field: "conference.name", boost: 1 },
] as const;

// simple_query_string não quebra com sintaxe inválida digitada pelo usuário
export function buildPublicationSearchClause(search: string) {
  return {
    bool: {
      should: [
        {
          simple_query_string: {
            query: search,
            fields: [...PUBLICATION_SEARCH_FIELDS],
            default_operator: "and" as const,
            lenient: true,
          },
        },
        // "educação" também encontra a palavra-chave/revista cadastrada como "Educação"
        ...EXACT_VALUE_FIELDS.map(({ field, boost }) => ({
          term: { [field]: { value: search, case_insensitive: true, boost } },
        })),
      ],
      minimum_should_match: 1,
    },
  };
}

export function buildPublicationQuery(
  filters: PublicationsDashboardFilters,
  search = "",
) {
  const bool: Record<string, unknown> = {
    filter: buildPublicationFilterClauses(filters),
  };

  if (search) {
    bool.must = [buildPublicationSearchClause(search)];
  }

  return { bool };
}
