import type { NextApiRequest, NextApiResponse } from "next";
import { createElasticsearchClient } from "../../../services/ElasticsearchClient";
import logger from "../../../services/Logger";
import type {
  ProgramsAreaInstitutionResponse,
  ProgramsDashboardErrorResponse,
} from "../../../types/ProgramsDashboard";

const client = createElasticsearchClient();

type TermBucket = {
  key: string | number;
  doc_count: number;
};

type ProgramsAggregations = {
  by_area?: { buckets?: (TermBucket & { by_org?: { buckets?: TermBucket[] } })[] };
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ProgramsAreaInstitutionResponse | ProgramsDashboardErrorResponse>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Metodo nao permitido." });
  }

  const index = process.env.INDEX_PROGRAM;

  if (!index) {
    logger.error("[dashboard/programs-area-institution] INDEX_PROGRAM is not configured");
    return res.status(500).json({ error: "Servico indisponivel." });
  }

  try {
    const response = await client.search({
      index,
      size: 0,
      aggs: {
        by_area: {
          terms: { field: "evaluationArea", order: { _count: "desc" }, size: 10 },
          aggs: {
            by_org: {
              terms: { field: "orgUnit.name", order: { _count: "desc" }, size: 3 },
            },
          },
        },
      },
    });

    const aggregations = response.aggregations as ProgramsAggregations | undefined;

    return res.status(200).json({
      areas: (aggregations?.by_area?.buckets ?? []).map((bucket) => ({
        area: String(bucket.key).trim(),
        count: bucket.doc_count,
        institutions: (bucket.by_org?.buckets ?? []).map((org) => ({
          name: String(org.key).trim(),
          count: org.doc_count,
        })),
      })),
    });
  } catch (error: unknown) {
    logger.error("[dashboard/programs-area-institution] falha ao carregar o painel");
    logger.error(error);
    return res.status(500).json({ error: "Falha ao carregar o painel." });
  }
}
