import type { NextApiRequest, NextApiResponse } from "next";
import { createElasticsearchClient } from "../../../services/ElasticsearchClient";
import logger from "../../../services/Logger";
import type {
  PeopleDashboardErrorResponse,
  PeopleDashboardFilters,
  PeopleSpecializationHeatmap,
  PeopleSpecializationPoint,
} from "../../../types/PeopleDashboard";

const client = createElasticsearchClient();

const MAX_FILTER_LENGTH = 200;
const TOP_INSTITUTIONS_SIZE = 20;
const PATH_SEPARATOR = " / ";
const QUERY_OPTIONS = { requestTimeout: 30000, maxRetries: 1 };

const FILTER_FIELDS: Record<string, string> = {};

const KNOWN_MAJOR_AREAS = [
  "Ciências Exatas e da Terra",
  "Ciências Biológicas",
  "Engenharias",
  "Ciências da Saúde",
  "Ciências Agrárias",
  "Ciências Sociais Aplicadas",
  "Ciências Humanas",
  "Linguística, Letras e Artes",
];

class InvalidSpecializationRequestError extends Error {}

// Lê o filtro e verifica se é válido
function readFilter(value: string | string[] | undefined, field: string): string {
  if (value === undefined) return "";

  if (Array.isArray(value)) {
    throw new InvalidSpecializationRequestError(`O filtro ${field} deve possuir apenas um valor.`);
  }

  const normalized = value.trim();

  if (normalized.length > MAX_FILTER_LENGTH) {
    throw new InvalidSpecializationRequestError(`O filtro ${field} e invalido.`);
  }

  return normalized;

}

// Lê os filtros da requisição e retorna um objeto com os filtros
function getFilters(req: NextApiRequest): PeopleDashboardFilters {
  return Object.fromEntries(
    Object.keys(FILTER_FIELDS).map((field) => [
      field,
      readFilter(req.query[field], field),
    ]),
  );
}

// Constrói a query para a busca
function buildQuery(filters: PeopleDashboardFilters) {
  const clauses: object[] = Object.entries(filters)
    .filter(([, value]) => value)
    .map(([field, value]) => ({ term: { [FILTER_FIELDS[field]]: value } }));

  // Exigir que tenha ao menos afiliação e área de pesquisa preenchidas
  clauses.push({ exists: { field: "affiliation.name" } });
  clauses.push({ exists: { field: "researchArea" } });

  return { bool: { filter: clauses } };
}

// Constrói os filtros para as grandes áreas de pesquisa
function majorAreaFilterClauses() {
  return Object.fromEntries(
    KNOWN_MAJOR_AREAS.map((area) => [
      area,
      {
        bool: {
          should: [
            { term: { researchArea: area } },
            { prefix: { researchArea: `${area}${PATH_SEPARATOR}` } },
          ],
          minimum_should_match: 1,
        },
      },
    ]),
  );
}

type Bucket = {
  key: string;
  doc_count: number;
  by_major_area?: {
    buckets?: Record<string, { doc_count: number }>;
  };
};

// Handler para a API
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PeopleSpecializationHeatmap | PeopleDashboardErrorResponse>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Metodo nao permitido." });
  }

  const index = process.env.INDEX_PERSON;
  if (!index) {
    logger.error("[dashboard/people-specialization] INDEX_PERSON is not configured");
    return res.status(500).json({ error: "Servico indisponivel." });
  }

  let filters: PeopleDashboardFilters;
  try {
    filters = getFilters(req);
  } catch (error) {
    if (error instanceof InvalidSpecializationRequestError) {
      return res.status(400).json({ error: error.message });
    }
    throw error;
  }

  try {
    const query = buildQuery(filters);

    const response = await client.search(
      {
        index,
        size: 0,
        query,
        aggs: {
          top_institutions: {
            terms: {
              field: "affiliation.name",
              size: TOP_INSTITUTIONS_SIZE,
              order: { _count: "desc" },
            },
            aggs: {
              by_major_area: {
                filters: {
                  filters: majorAreaFilterClauses(),
                },
              },
            },
          },
        },
      },
      QUERY_OPTIONS,
    );

    const rawInstitutions = (
      response.aggregations as { top_institutions?: { buckets?: Bucket[] } } | undefined
    )?.top_institutions?.buckets ?? [];

    // Filtra apenas instituições que possuem pelo menos 1 pesquisador vinculado a alguma grande área e limita ao top 12
    const institutionBuckets = rawInstitutions
      .filter((instBucket) => {
        const areaBuckets = instBucket?.by_major_area?.buckets ?? {};
        return Object.values(areaBuckets).some((b) => (b?.doc_count ?? 0) > 0);
      })
      .slice(0, 12);

    const institutions = institutionBuckets
      .map((b) => String(b.key).trim())
      .filter(Boolean);

    const majorAreas = [...KNOWN_MAJOR_AREAS];

    const matrix: [number, number, number][] = [];
    const items: PeopleSpecializationPoint[] = [];

    institutions.forEach((inst, instIdx) => {
      const instBucket = institutionBuckets[instIdx];
      const areaBuckets = instBucket?.by_major_area?.buckets ?? {};

      majorAreas.forEach((area, areaIdx) => {
        const count = areaBuckets[area]?.doc_count ?? 0;
        if (count > 0) {
          matrix.push([instIdx, areaIdx, count]);
          items.push({
            institution: inst,
            majorArea: area,
            count,
          });
        }
      });
    });

    return res.status(200).json({
      institutions,
      majorAreas,
      matrix,
      items,
    });
  } catch (error) {
    logger.error("[dashboard/people-specialization] falha ao carregar especialização institucional");
    logger.error(error);
    return res.status(500).json({ error: "Falha ao carregar o painel." });
  }
}
