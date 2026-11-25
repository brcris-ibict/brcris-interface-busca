import type { NextApiRequest, NextApiResponse } from "next";
import { createElasticsearchClient } from "../../../services/ElasticsearchClient";
import logger from "../../../services/Logger";
import type {
  ThesesDashboardErrorResponse,
  ThesesSummaryResponse,
} from "../../../types/ThesesDashboard";

const client = createElasticsearchClient();

const THESIS_TYPES = ["Tese", "Dissertação"] as const;

type SummaryAggregations = {
  theses_scope?: {
    doc_count?: number;
    by_type?: { buckets?: Array<{ key?: string | number; doc_count?: number }> };
    institutions?: { value?: number };
  };
  articles?: { doc_count?: number };
};

function bucketCount(
  buckets: Array<{ key?: string | number; doc_count?: number }> | undefined,
  key: string,
) {
  return buckets?.find((bucket) => String(bucket.key) === key)?.doc_count ?? 0;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ThesesSummaryResponse | ThesesDashboardErrorResponse>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Metodo nao permitido." });
  }

  const index = process.env.INDEX_PUBLICATION;

  if (!index) {
    logger.error("[dashboard/theses-summary] INDEX_PUBLICATION is not configured");
    return res.status(500).json({ error: "Servico indisponivel." });
  }

  try {
    const response = await client.search({
      index,
      size: 0,
      track_total_hits: false,
      query: { match_all: {} },
      aggs: {
        theses_scope: {
          filter: { terms: { type: [...THESIS_TYPES] } },
          aggs: {
            by_type: { terms: { field: "type", size: 10 } },
            institutions: {
              cardinality: {
                field: "sponsorOrgUnit.id",
                precision_threshold: 40000,
              },
            },
          },
        },
        articles: {
          filter: { term: { type: "Artigo" } },
        },
      },
    });

    const aggregations = response.aggregations as SummaryAggregations | undefined;
    const buckets = aggregations?.theses_scope?.by_type?.buckets;
    const dissertations = bucketCount(buckets, "Dissertação");
    const theses = bucketCount(buckets, "Tese");

    return res.status(200).json({
      summary: {
        total: dissertations + theses,
        dissertations,
        theses,
        articles: aggregations?.articles?.doc_count ?? 0,
        institutions: aggregations?.theses_scope?.institutions?.value ?? 0,
      },
    });
  } catch (error: unknown) {
    logger.error("[dashboard/theses-summary] falha ao carregar o painel");
    logger.error(error);
    return res.status(500).json({ error: "Falha ao carregar o painel." });
  }
}
