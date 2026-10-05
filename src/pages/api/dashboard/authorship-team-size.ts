import type { NextApiRequest, NextApiResponse } from "next";
import { createElasticsearchClient } from "../../../services/ElasticsearchClient";
import logger from "../../../services/Logger";
import type {
  PublicationsDashboardErrorResponse,
  PublicationsDashboardFilters,
  PublicationsTeamSize,
  PublicationsTeamSizeBand,
} from "../../../types/PublicationsDashboard";

const client = createElasticsearchClient();
const YEAR_FROM = 1960;
const MAX_FILTER_LENGTH = 200;
const SAMPLE_TARGET = 200_000;
// Painel interativo: melhor falhar rápido do que segurar os filtros por minutos
const QUERY_OPTIONS = { requestTimeout: 30000, maxRetries: 1 };

const TEAM_SIZE_RANGES: {
  key: PublicationsTeamSizeBand;
  from: number;
  to?: number;
}[] = [
  { key: "1", from: 1, to: 2 },
  { key: "2", from: 2, to: 3 },
  { key: "3-5", from: 3, to: 6 },
  { key: "6-10", from: 6, to: 11 },
  { key: "11+", from: 11 },
];

class InvalidTeamSizeRequestError extends Error {}

type Bucket = {
  key: string | number;
  doc_count: number;
};

type TeamSizeAggregations = {
  withAuthors?: { doc_count?: number };
  sample?: {
    teamSize?: { buckets?: Bucket[] };
  };
};

function readFilter(value: string | string[] | undefined, field: string): string {
  if (value === undefined) return "";
  if (Array.isArray(value)) {
    throw new InvalidTeamSizeRequestError(`O filtro ${field} deve possuir apenas um valor.`);
  }
  const normalized = value.trim();
  if (normalized.length > MAX_FILTER_LENGTH) {
    throw new InvalidTeamSizeRequestError(`O filtro ${field} e invalido.`);
  }
  return normalized;
}

function readFilters(req: NextApiRequest): PublicationsDashboardFilters {
  const filters = {
    publicationDate: readFilter(req.query.publicationDate, "publicationDate"),
    type: readFilter(req.query.type, "type"),
    language: readFilter(req.query.language, "language"),
    institution: readFilter(req.query.institution, "institution"),
  };

  if (filters.publicationDate) {
    const year = Number(filters.publicationDate);
    if (
      !/^\d{4}$/.test(filters.publicationDate) ||
      year < YEAR_FROM ||
      year > new Date().getFullYear()
    ) {
      throw new InvalidTeamSizeRequestError("O filtro publicationDate e invalido.");
    }
  }

  return filters;
}

function buildQuery(filters: PublicationsDashboardFilters) {
  const clauses: Record<string, unknown>[] = [
    {
      range: {
        publicationDate: {
          gte: String(YEAR_FROM),
          lte: String(new Date().getFullYear()),
        },
      },
    },
  ];
  if (filters.publicationDate) {
    clauses.push({ term: { publicationDate: filters.publicationDate } });
  }
  if (filters.type) clauses.push({ term: { type: filters.type } });
  if (filters.language) clauses.push({ term: { language: filters.language } });
  if (filters.institution) {
    clauses.push({ term: { "sponsorOrgUnit.name": filters.institution } });
  }
  return { bool: { filter: clauses } };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PublicationsTeamSize | PublicationsDashboardErrorResponse>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Metodo nao permitido." });
  }

  const index = process.env.INDEX_PUBLICATION;
  if (!index) {
    return res.status(500).json({ error: "Servico indisponivel." });
  }

  let filters: PublicationsDashboardFilters;
  try {
    filters = readFilters(req);
  } catch (error) {
    if (error instanceof InvalidTeamSizeRequestError) {
      return res.status(400).json({ error: error.message });
    }
    throw error;
  }

  try {
    const query = buildQuery(filters);
    const { count: total } = await client.count({ index, query }, QUERY_OPTIONS);
    // random_sampler aceita probabilidade < 0.5 ou exatamente 1
    const probability = total > SAMPLE_TARGET * 2 ? SAMPLE_TARGET / total : 1;

    const response = await client.search(
      {
        index,
        size: 0,
        query,
        runtime_mappings: {
          author_count: {
            type: "long",
            script: { source: "emit(doc['author.id'].size())" },
          },
        },
        aggs: {
          withAuthors: { filter: { exists: { field: "author.id" } } },
          sample: {
            random_sampler: { probability, seed: 42 },
            aggs: {
              teamSize: {
                range: {
                  field: "author_count",
                  ranges: TEAM_SIZE_RANGES.map(({ key, from, to }) =>
                    to === undefined ? { key, from } : { key, from, to },
                  ),
                },
              },
            },
          },
        },
      },
      QUERY_OPTIONS,
    );

    const aggs = response.aggregations as TeamSizeAggregations | undefined;
    const withAuthors = aggs?.withAuthors?.doc_count ?? 0;
    const sampleBuckets = aggs?.sample?.teamSize?.buckets ?? [];
    const sampleTotal = sampleBuckets.reduce((sum, bucket) => sum + bucket.doc_count, 0);
    return res.status(200).json({
      total,
      withAuthors,
      withoutAuthors: Math.max(total - withAuthors, 0),
      // Proporção da amostra aplicada ao total exato com autoria
      bands: TEAM_SIZE_RANGES.map(({ key }) => {
        const sampleCount =
          sampleBuckets.find((bucket) => String(bucket.key) === key)?.doc_count ?? 0;
        return {
          band: key,
          count: sampleTotal > 0 ? Math.round((sampleCount / sampleTotal) * withAuthors) : 0,
        };
      }),
      sampled: probability < 1,
    });
  } catch (error) {
    logger.error("[authorship-team-size] falha na consulta");
    logger.error(error);
    return res.status(500).json({ error: "Falha ao carregar o painel." });
  }
}
