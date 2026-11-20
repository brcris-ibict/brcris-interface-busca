import type { NextApiRequest, NextApiResponse } from "next";
import { createElasticsearchClient } from "../../../services/ElasticsearchClient";
import logger from "../../../services/Logger";
import type {
  PatentKindResponse,
  PatentsDashboardErrorResponse,
} from "../../../types/PatentsDashboard";

const client = createElasticsearchClient();

const KIND_SIZE = 50;

type KindAggregations = {
  stages?: { buckets?: { key: string; doc_count: number }[] };
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PatentKindResponse | PatentsDashboardErrorResponse>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Metodo nao permitido." });
  }

  const index = process.env.INDEX_PATENT;

  if (!index) {
    logger.error("[dashboard/patents-kind] INDEX_PATENT is not configured");
    return res.status(500).json({ error: "Servico indisponivel." });
  }

  try {
    const response = await client.search({
      index,
      size: 0,
      track_total_hits: true,
      aggs: {
        stages: {
          terms: {
            field: "kindCode",
            size: KIND_SIZE,
            order: { _count: "desc" },
          },
        },
      },
    });

    const aggregations = response.aggregations as KindAggregations | undefined;
    const rawTotal = response.hits?.total;

    return res.status(200).json({
      items: (aggregations?.stages?.buckets ?? []).map((bucket) => ({
        code: bucket.key,
        count: bucket.doc_count,
      })),
      total: typeof rawTotal === "number" ? rawTotal : rawTotal?.value ?? 0,
    });
  } catch (error: unknown) {
    logger.error("[dashboard/patents-kind] falha ao carregar o painel");
    logger.error(error);
    return res.status(500).json({ error: "Falha ao carregar o painel." });
  }
}
