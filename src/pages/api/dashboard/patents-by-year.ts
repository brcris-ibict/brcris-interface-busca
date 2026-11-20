import type { NextApiRequest, NextApiResponse } from "next";
import { GRANTED_KIND_CODES, PATENT_DEPOSIT_YEAR_SCRIPT } from "../../../lib/patentScripts";
import { createElasticsearchClient } from "../../../services/ElasticsearchClient";
import logger from "../../../services/Logger";
import type {
  PatentByYearResponse,
  PatentYearPoint,
  PatentsDashboardErrorResponse,
} from "../../../types/PatentsDashboard";

const client = createElasticsearchClient();

// O último ano da base costuma estar parcialmente carregado.
const INCOMPLETE_YEAR_RATIO = 0.6;

type YearBucket = { key: number | string; doc_count: number; granted?: { doc_count?: number } };
type YearAggregations = { by_year?: { buckets?: YearBucket[] } };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PatentByYearResponse | PatentsDashboardErrorResponse>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Metodo nao permitido." });
  }

  const index = process.env.INDEX_PATENT;

  if (!index) {
    logger.error("[dashboard/patents-by-year] INDEX_PATENT is not configured");
    return res.status(500).json({ error: "Servico indisponivel." });
  }

  try {
    const response = await client.search({
      index,
      size: 0,
      runtime_mappings: {
        deposit_year: { type: "long", script: { source: PATENT_DEPOSIT_YEAR_SCRIPT } },
      },
      aggs: {
        by_year: {
          terms: { field: "deposit_year", size: 200, order: { _key: "asc" } },
          aggs: { granted: { filter: { terms: { kindCode: GRANTED_KIND_CODES } } } },
        },
      },
    });

    const aggregations = response.aggregations as YearAggregations | undefined;
    const byYear = new Map(
      (aggregations?.by_year?.buckets ?? []).map((bucket) => [
        Number(bucket.key),
        { deposits: bucket.doc_count, granted: bucket.granted?.doc_count ?? 0 },
      ]),
    );

    const items: PatentYearPoint[] = [];
    if (byYear.size > 0) {
      const first = Math.min(...byYear.keys());
      const last = Math.max(...byYear.keys());
      for (let year = first; year <= last; year += 1) {
        const point = byYear.get(year);
        items.push({ year, deposits: point?.deposits ?? 0, granted: point?.granted ?? 0 });
      }
    }

    const lastPoint = items[items.length - 1];
    const previousPoint = items[items.length - 2];
    const incompleteYear =
      lastPoint && previousPoint && lastPoint.deposits < previousPoint.deposits * INCOMPLETE_YEAR_RATIO
        ? lastPoint.year
        : null;

    return res.status(200).json({ items, incompleteYear });
  } catch (error: unknown) {
    logger.error("[dashboard/patents-by-year] falha ao carregar o painel");
    logger.error(error);
    return res.status(500).json({ error: "Falha ao carregar o painel." });
  }
}
