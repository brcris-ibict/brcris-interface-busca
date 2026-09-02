import type { NextApiRequest, NextApiResponse } from "next";
import { createElasticsearchClient } from "../../../services/ElasticsearchClient";
import logger from "../../../services/Logger";
import type { PublicationsDashboardErrorResponse, PublicationsDashboardFilters, PublicationsDashboardResponse } from "../../../types/PublicationsDashboard";

const client = createElasticsearchClient();

const MAX_FILTER_LENGTH = 200;
const MIN_PUBLICATION_YEAR = 1960;
const ARTICLE_PUBLICATION_TYPE = "Artigo";

function getCurrentPublicationYear() {
  return new Date().getFullYear();

}

type TermBucket = {
  key: string | number;
  key_as_string?: string;
  doc_count: number;
};

type TermsAggregation = {
  buckets?: TermBucket[];
};

type AnnualByTypeBucket = TermBucket & {
  byType?: TermsAggregation;
};

type DashboardAggregations = {
  annual?: TermsAggregation;
  annualByType?: {
    buckets?: AnnualByTypeBucket[];
  };
  byType?: TermsAggregation;
  byLanguage?: TermsAggregation;
  byInstitution?: TermsAggregation;
  institutionsCount?: { value?: number };
  publicationsWithoutInstitution?: { doc_count?: number };
  publicationsWithoutLanguage?: { doc_count?: number };
  topJournalsArticles?: {
    doc_count?: number;
    byJournal?: TermsAggregation;
  };
  filterOptions?: {
    withoutFutureYears?: {
      publicationDates?: TermsAggregation;
      types?: TermsAggregation;
      languages?: TermsAggregation;
      institutions?: TermsAggregation;
    };
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
    institution: readFilter(req.query.institution, "institution"),
  };

  if (filters.publicationDate && !/^\d{4}$/.test(filters.publicationDate)) {
    throw new InvalidDashboardRequestError(
      "O filtro publicationDate deve ser um ano com quatro digitos.",
    );

  }

  const currentYear = getCurrentPublicationYear();

  if ( filters.publicationDate && Number(filters.publicationDate) > currentYear ) {
    throw new InvalidDashboardRequestError(
      "O filtro publicationDate nao pode ser posterior ao ano atual.",
    );

  }

  if ( filters.publicationDate && Number(filters.publicationDate) < MIN_PUBLICATION_YEAR ) {
    throw new InvalidDashboardRequestError(
      "O filtro publicationDate nao pode ser anterior a 1900.",
    );

  }

  return filters;

}

const FILTER_FIELDS: Record<keyof PublicationsDashboardFilters, string> = {
  publicationDate: "publicationDate",
  type: "type",
  language: "language",
  institution: "sponsorOrgUnit.name",
};

function buildQuery(filters: PublicationsDashboardFilters) {
  const currentYear = String(getCurrentPublicationYear());

  const clauses: Record<string, unknown>[] = [
    {
      range: {
        publicationDate: {
          gte: String(MIN_PUBLICATION_YEAR),
          lte: currentYear,
        },
      },
    },
  ];

  ( Object.entries(filters) as [keyof PublicationsDashboardFilters, string][])
    .filter(([, value]) => value)
    .forEach(([field, value]) => {
      clauses.push({
        term: { [FILTER_FIELDS[field]]: value },
      });
    });

  return { bool: { filter: clauses } };

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
  res: NextApiResponse<PublicationsDashboardResponse | PublicationsDashboardErrorResponse>
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
    const response = await client.search({
      index,
      size: 0,
      track_total_hits: true,
      query: buildQuery(filters),
      aggs: {
        annual: {
          terms: {
            field: "publicationDate",
            include: filters.publicationDate ? [filters.publicationDate] : undefined,
            size: 200,
            order: { _key: "asc" },
          },
        },
        annualByType: {
          terms: {
            field: "publicationDate",
            include: filters.publicationDate ? [filters.publicationDate] : undefined,
            size: 200,
            order: { _key: "asc" },
          },
          aggs: {
            byType: {
              terms: {
                field: "type",
                include: filters.type ? [filters.type] : undefined,
                size: 50,
                order: { _count: "desc" },
              },
            },
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
        byLanguage: {
          terms: {
            field: "language",
            include: filters.language ? [filters.language] : undefined,
            size: 100,
            order: { _count: "desc" },
          },
        },
        byInstitution: {
          terms: {
            field: "sponsorOrgUnit.name",
            include: filters.institution ? [filters.institution] : undefined,
            size: 10000,
            order: { _count: "desc" },
          },
        },
        institutionsCount: {
          cardinality: {
            field: "sponsorOrgUnit.name",
          },
        },
        publicationsWithoutInstitution: {
          filter: {
            bool: {
              must_not: {
                exists: { field: "sponsorOrgUnit.name" },
              },
            },
          },
        },
        publicationsWithoutLanguage: {
          filter: {
            bool: {
              must_not: {
                exists: { field: "language" },
              },
            },
          },
        },
        topJournalsArticles: {
          filter: {
            bool: {
              filter: [
                { term: { type: ARTICLE_PUBLICATION_TYPE } },
                { exists: { field: "journal.title" } },
              ],
            },
          },
          aggs: {
            byJournal: {
              terms: {
                field: "journal.title",
                size: 10,
                order: { _count: "desc" },
              },
            },
          },
        },
        filterOptions: {
          global: {},
          aggs: {
            withoutFutureYears: {
              filter: {
                range: {
                  publicationDate: {
                    gte: String(MIN_PUBLICATION_YEAR),
                    lte: String(getCurrentPublicationYear()),
                  },
                },
              },
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
                institutions: {
                  terms: {
                    field: "sponsorOrgUnit.name",
                    size: 10000,
                    order: { _count: "desc" },
                  },
                },
              },
            },
          },
        },
      },
    });

    const aggregations = response.aggregations as
      DashboardAggregations | undefined;

    const annual = getBuckets(aggregations?.annual).map((bucket) => ({
      year: getBucketKey(bucket),
      count: bucket.doc_count,
    }));
    const annualByType = (aggregations?.annualByType?.buckets ?? []).map(
      (bucket) => ({
        year: getBucketKey(bucket),
        types: getBuckets(bucket.byType).map((typeBucket) => ({
          type: getBucketKey(typeBucket),
          count: typeBucket.doc_count,
        })),
      }),
    );
    const byType = getBuckets(aggregations?.byType).map((bucket) => ({
      type: getBucketKey(bucket),
      count: bucket.doc_count,
    }));
    const byLanguage = getBuckets(aggregations?.byLanguage).map((bucket) => ({
      language: getBucketKey(bucket),
      count: bucket.doc_count,
    }));
    const byInstitution = getBuckets(aggregations?.byInstitution).map(
      (bucket) => ({
        institution: getBucketKey(bucket),
        count: bucket.doc_count,
      }),
    );

    const total = getTotal(response.hits?.total);

    const lastYearPoint = annual.length > 0 ? annual.reduce((latest, point) => point.year > latest.year ? point : latest ) : { year: "", count: 0 };

    const predominant = byType[0];
    const predominantTypeShare = predominant && predominant.count > 0 ? Number(((predominant.count / total) * 100).toFixed(1)) : 0;

    const topJournalBuckets = getBuckets(aggregations?.topJournalsArticles?.byJournal);
    const totalArticles = aggregations?.topJournalsArticles?.doc_count ?? 0;

    const topJournalsArticles = {
      totalArticles,
      items: topJournalBuckets.map((bucket, index) => ({
        rank: index + 1,
        journal: getBucketKey(bucket),
        count: bucket.doc_count,
        share: totalArticles > 0 ? Number(((bucket.doc_count / totalArticles) * 100).toFixed(1)) : 0,
      })),
    };

    return res.status(200).json({
      total,
      publicationsWithoutInstitution: aggregations?.publicationsWithoutInstitution?.doc_count ?? 0,
      publicationsWithoutLanguage: aggregations?.publicationsWithoutLanguage?.doc_count ?? 0,
      summary: {
        total,
        lastYear: lastYearPoint.year,
        lastYearCount: lastYearPoint.count,
        institutionsCount: aggregations?.institutionsCount?.value ?? 0,
        predominantType: predominant?.type ?? "",
        predominantTypeShare,
      },
      annual,
      annualByType,
      byType,
      byLanguage,
      byInstitution,
      topJournalsArticles,
      filterOptions: {
        publicationDates: getBuckets(
          aggregations?.filterOptions?.withoutFutureYears?.publicationDates,
        ).map(getBucketKey),
        types: getBuckets(
          aggregations?.filterOptions?.withoutFutureYears?.types,
        ).map(getBucketKey),
        languages: getBuckets(
          aggregations?.filterOptions?.withoutFutureYears?.languages,
        ).map(getBucketKey),
        institutions: getBuckets(
          aggregations?.filterOptions?.withoutFutureYears?.institutions,
        ).map(getBucketKey),
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
