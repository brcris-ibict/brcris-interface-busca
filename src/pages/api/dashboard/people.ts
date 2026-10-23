import type { NextApiRequest, NextApiResponse } from "next";
import { createElasticsearchClient } from "../../../services/ElasticsearchClient";
import logger from "../../../services/Logger";
import type {
  PeopleDashboardErrorResponse,
  PeopleDashboardFilters,
  PeopleDashboardResponse,
} from "../../../types/PeopleDashboard";

const client = createElasticsearchClient();

const MAX_FILTER_LENGTH = 200;

// Campo do índice de pessoas para cada filtro do painel; filtros novos entram aqui
const FILTER_FIELDS: Record<string, string> = {};

type DocCountAggregation = {
  doc_count?: number;
};

type TermBucket = {
  key: string | number;
  doc_count: number;
};

type PeopleAggregations = {
  by_nationality?: { buckets?: TermBucket[] };
  without_nationality?: DocCountAggregation;
  by_publication_type?: { buckets?: TermBucket[] };
  by_affiliation?: { buckets?: TermBucket[] };
  with_orcid?: DocCountAggregation;
  with_publications?: DocCountAggregation;
  institutions?: { value?: number };
  in_research_group?: DocCountAggregation;
  group_leaders?: DocCountAggregation;
};

class InvalidDashboardRequestError extends Error {}

// Função responsável por ler o filtro e retornar o valor normalizado
function readFilter(value: string | string[] | undefined, field: string): string {
  if (value === undefined) return "";

  if (Array.isArray(value)) {
    throw new InvalidDashboardRequestError(
      `O filtro ${field} deve possuir apenas um valor.`,
    );
  }

  const normalizedValue = value.trim();

  if (normalizedValue.length > MAX_FILTER_LENGTH) {
    throw new InvalidDashboardRequestError(`O filtro ${field} e invalido.`);
  }

  return normalizedValue;
}

// Função responsável por ler os filtros da requisição e retornar um objeto com os filtros normalizados
function getFilters(req: NextApiRequest): PeopleDashboardFilters {
  return Object.fromEntries(
    Object.keys(FILTER_FIELDS).map((field) => [
      field,
      readFilter(req.query[field], field),
    ]),
  );
}

// Função responsável por construir a query para o Elasticsearch
function buildQuery(filters: PeopleDashboardFilters) {
  const clauses = Object.entries(filters)
    .filter(([, value]) => value)
    .map(([field, value]) => ({ term: { [FILTER_FIELDS[field]]: value } }));

  return { bool: { filter: clauses } };
}

// Função responsável por retornar o total de documentos encontrados
function getTotal(total: number | { value: number } | undefined): number {
  if (typeof total === "number") return total;
  return total?.value ?? 0;
}

// Função responsável por lidar com a requisição e retornar a resposta
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PeopleDashboardResponse | PeopleDashboardErrorResponse>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Metodo nao permitido." });
  }

  const index = process.env.INDEX_PERSON;

  if (!index) {
    logger.error("[dashboard/people] INDEX_PERSON is not configured");
    return res.status(500).json({ error: "Servico indisponivel." });
  }

  try {
    const filters = getFilters(req);
    const response = await client.search({
      index,
      size: 0,
      track_total_hits: true,
      query: buildQuery(filters),
      aggs: {
        with_orcid: { filter: { exists: { field: "orcid" } } },
        with_publications: { filter: { exists: { field: "authorOf" } } },
        institutions: {
          cardinality: { field: "affiliation.name", precision_threshold: 40000 },
        },
        in_research_group: {
          filter: {
            bool: {
              should: [
                { exists: { field: "memberOf" } },
                { exists: { field: "leaderOf" } },
              ],
              minimum_should_match: 1,
            },
          },
        },
        group_leaders: { filter: { exists: { field: "leaderOf" } } },
        // doc_count conta pesquisadores; cardinality em name subconta homônimos
        by_nationality: {
          terms: { field: "nationality", size: 200, order: { _count: "desc" } },
        },
        without_nationality: { missing: { field: "nationality" } },
        by_publication_type: {
          terms: { field: "authorOf.type", size: 50, order: { _count: "desc" } },
        },
        by_affiliation: {
          terms: { field: "affiliation.name", size: 10000, order: { _count: "desc" } },
        },
      },
    });

    const aggregations = response.aggregations as PeopleAggregations | undefined;
    const total = getTotal(response.hits?.total);

    return res.status(200).json({
      summary: {
        total,
        withOrcid: aggregations?.with_orcid?.doc_count ?? 0,
        withPublications: aggregations?.with_publications?.doc_count ?? 0,
        institutionsCount: aggregations?.institutions?.value ?? 0,
        inResearchGroup: aggregations?.in_research_group?.doc_count ?? 0,
        groupLeaders: aggregations?.group_leaders?.doc_count ?? 0,
      },
      byNationality: (aggregations?.by_nationality?.buckets ?? [])
        .map((bucket) => ({
          nationality: String(bucket.key).trim(),
          count: bucket.doc_count,
        }))
        .filter((item) => item.nationality),
      researchersWithoutNationality: aggregations?.without_nationality?.doc_count ?? 0,
      byPublicationType: (aggregations?.by_publication_type?.buckets ?? [])
        .map((bucket) => ({
          type: String(bucket.key).trim(),
          count: bucket.doc_count,
        }))
        .filter((item) => item.type),
      byAffiliation: (aggregations?.by_affiliation?.buckets ?? [])
        .map((bucket, index) => {
          const count = bucket.doc_count;
          const share = total > 0 ? Number(((count / total) * 100).toFixed(2)) : 0;
          return {
            rank: index + 1,
            affiliation: String(bucket.key).trim(),
            count,
            share,
          };
        })
        .filter((item) => item.affiliation),
    });
  } catch (error: unknown) {
    if (error instanceof InvalidDashboardRequestError) {
      return res.status(400).json({ error: error.message });
    }

    logger.error("[dashboard/people] falha ao carregar o painel");
    logger.error(error);
    return res.status(500).json({ error: "Falha ao carregar o painel." });
  }
}
