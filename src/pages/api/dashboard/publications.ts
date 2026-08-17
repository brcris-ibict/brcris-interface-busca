import { Client } from "es7";
import type { NextApiRequest, NextApiResponse } from "next";
import logger from "../../../services/Logger";
import type {
  PublicationsDashboardErrorResponse,
  PublicationsDashboardFilters,
  PublicationsDashboardResponse,
} from "../../../types/PublicationsDashboard";

const client = new Client({
  maxRetries: 5,
  requestTimeout: 60000,
  sniffOnStart: true,
  node: process.env.HOST_ELASTIC,
  auth: {
    apiKey: process.env.API_KEY!,
  },
});

const MAX_FILTER_LENGTH = 200;

type TermBucket = {
  key: string | number;
  key_as_string?: string;
  doc_count: number;
};

type TermsAggregation = {
  buckets?: TermBucket[];
};

type DashboardAggregations = {
  annual?: TermsAggregation;
  byType?: TermsAggregation;
  filterOptions?: {
    publicationDates?: TermsAggregation;
    types?: TermsAggregation;
    languages?: TermsAggregation;
  };
};

class InvalidDashboardRequestError extends Error {}

function readFilter(
  value: string | string[] | undefined,
  field: keyof PublicationsDashboardFilters,
): string {
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

function getFilters(req: NextApiRequest): PublicationsDashboardFilters {
  const filters = {
    publicationDate: readFilter(req.query.publicationDate, "publicationDate"),
    type: readFilter(req.query.type, "type"),
    language: readFilter(req.query.language, "language"),
  };

  if (filters.publicationDate && !/^\d{4}$/.test(filters.publicationDate)) {
    throw new InvalidDashboardRequestError(
      "O filtro publicationDate deve ser um ano com quatro digitos.",
    );
  }

  return filters;
}

function buildQuery(filters: PublicationsDashboardFilters) {
  const clauses = Object.entries(filters)
    .filter(([, value]) => value)
    .map(([field, value]) => ({ term: { [field]: value } }));

  return clauses.length > 0 ? { bool: { filter: clauses } } : { match_all: {} };
}

function getBuckets(aggregation?: TermsAggregation): TermBucket[] {
  return aggregation?.buckets ?? [];
}

function getBucketKey(bucket: TermBucket): string {
  return String(bucket.key_as_string ?? bucket.key);
}

function getTotal(total: number | { value: number } | undefined): number {
  if (typeof total === "number") return total;
  return total?.value ?? 0;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<
    PublicationsDashboardResponse | PublicationsDashboardErrorResponse
  >,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Metodo nao permitido." });
  }

  const index = process.env.INDEX_PUBLICATION;

  if (!index) {
    logger.error("INDEX_PUBLICATION is not configured");
    return res.status(500).json({ error: "Servico indisponivel." });
  }

  try {
    const filters = getFilters(req);
    const { body } = await client.search({
      index,
      body: {
        size: 0,
        track_total_hits: true,
        query: buildQuery(filters),
        aggs: {
          annual: {
            terms: {
              field: "publicationDate",
              include: filters.publicationDate
                ? [filters.publicationDate]
                : undefined,
              size: 200,
              order: { _key: "asc" },
            },
          },
          byType: {
            terms: {
              field: "type",
              include: filters.type ? [filters.type] : undefined,
              size: 100,
              order: { _count: "desc" },
            },
          },
          filterOptions: {
            global: {},
            aggs: {
              publicationDates: {
                terms: {
                  field: "publicationDate",
                  size: 200,
                  order: { _key: "desc" },
                },
              },
              types: {
                terms: {
                  field: "type",
                  size: 100,
                  order: { _key: "asc" },
                },
              },
              languages: {
                terms: {
                  field: "language",
                  size: 100,
                  order: { _key: "asc" },
                },
              },
            },
          },
        },
      },
    });

    const aggregations = body.aggregations as DashboardAggregations | undefined;

    return res.status(200).json({
      total: getTotal(body.hits?.total),
      annual: getBuckets(aggregations?.annual).map((bucket) => ({
        year: getBucketKey(bucket),
        count: bucket.doc_count,
      })),
      byType: getBuckets(aggregations?.byType).map((bucket) => ({
        type: getBucketKey(bucket),
        count: bucket.doc_count,
      })),
      filterOptions: {
        publicationDates: getBuckets(
          aggregations?.filterOptions?.publicationDates,
        ).map(getBucketKey),
        types: getBuckets(aggregations?.filterOptions?.types).map(getBucketKey),
        languages: getBuckets(aggregations?.filterOptions?.languages).map(
          getBucketKey,
        ),
      },
    });
  } catch (error: unknown) {
    if (error instanceof InvalidDashboardRequestError) {
      return res.status(400).json({ error: error.message });
    }

    logger.error(error);
    return res.status(500).json({ error: "Falha ao carregar o painel." });
  }
}
