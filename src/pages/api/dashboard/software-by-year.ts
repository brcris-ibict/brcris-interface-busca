import type { NextApiRequest, NextApiResponse } from "next";
import { DEPOSIT_YEAR_SCRIPT, RELEASE_YEAR_SCRIPT } from "../../../lib/softwareScripts";
import { createElasticsearchClient } from "../../../services/ElasticsearchClient";
import logger from "../../../services/Logger";
import type {
  SoftwareByYearResponse,
  SoftwareDashboardErrorResponse,
  SoftwareYearPoint,
} from "../../../types/SoftwareDashboard";

const client = createElasticsearchClient();

// O último ano da base costuma estar parcialmente carregado.
const INCOMPLETE_YEAR_RATIO = 0.6;

type YearBucket = { key: number | string; doc_count: number; granted?: { doc_count?: number } };

type YearAggregations = {
  by_year?: { buckets?: YearBucket[] };
  by_deposit_year?: { buckets?: YearBucket[] };
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SoftwareByYearResponse | SoftwareDashboardErrorResponse>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Metodo nao permitido." });
  }

  const index = process.env.INDEX_SOFTWARE;

  if (!index) {
    logger.error("[dashboard/software-by-year] INDEX_SOFTWARE is not configured");
    return res.status(500).json({ error: "Servico indisponivel." });
  }

  try {
    const response = await client.search({
      index,
      size: 0,
      runtime_mappings: {
        release_year: { type: "long", script: { source: RELEASE_YEAR_SCRIPT } },
        deposit_year: { type: "long", script: { source: DEPOSIT_YEAR_SCRIPT } },
      },
      aggs: {
        by_year: {
          terms: { field: "release_year", size: 200, order: { _key: "asc" } },
          aggs: {
            granted: { filter: { exists: { field: "concessionDate" } } },
          },
        },
        by_deposit_year: {
          terms: { field: "deposit_year", size: 200, order: { _key: "asc" } },
        },
      },
    });

    const aggregations = response.aggregations as YearAggregations | undefined;
    const releases = new Map(
      (aggregations?.by_year?.buckets ?? []).map((bucket) => [
        Number(bucket.key),
        { count: bucket.doc_count, granted: bucket.granted?.doc_count ?? 0 },
      ]),
    );
    const deposits = new Map(
      (aggregations?.by_deposit_year?.buckets ?? []).map((bucket) => [
        Number(bucket.key),
        bucket.doc_count,
      ]),
    );

    const items: SoftwareYearPoint[] = [];
    const years = [...releases.keys(), ...deposits.keys()];
    if (years.length > 0) {
      const first = Math.min(...years);
      const last = Math.max(...years);
      for (let year = first; year <= last; year += 1) {
        const release = releases.get(year);
        items.push({
          year,
          count: release?.count ?? 0,
          deposits: deposits.get(year) ?? 0,
          granted: release?.granted ?? 0,
        });
      }
    }

    const lastPoint = items[items.length - 1];
    const previousPoint = items[items.length - 2];
    const incompleteYear =
      lastPoint && previousPoint && lastPoint.count < previousPoint.count * INCOMPLETE_YEAR_RATIO
        ? lastPoint.year
        : null;

    return res.status(200).json({ items, incompleteYear });
  } catch (error: unknown) {
    logger.error("[dashboard/software-by-year] falha ao carregar o painel");
    logger.error(error);
    return res.status(500).json({ error: "Falha ao carregar o painel." });
  }
}
