import type { NextApiRequest, NextApiResponse } from "next";
import { createElasticsearchClient } from "../../../services/ElasticsearchClient";
import logger from "../../../services/Logger";
import type {
  ThesisByYearResponse,
  ThesisYearPoint,
  ThesesDashboardErrorResponse,
} from "../../../types/ThesesDashboard";

const client = createElasticsearchClient();

const THESIS_TYPES = ["Tese", "Dissertação"] as const;
const MIN_YEAR = 1990;
const INCOMPLETE_YEAR_RATIO = 0.6;

type TypeBucket = { key?: string | number; doc_count?: number };
type YearBucket = {
  key?: string | number;
  doc_count?: number;
  by_type?: { buckets?: TypeBucket[] };
};
type YearAggregations = { by_year?: { buckets?: YearBucket[] } };

function bucketCount(buckets: TypeBucket[] | undefined, key: string) {
  return buckets?.find((bucket) => String(bucket.key) === key)?.doc_count ?? 0;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ThesisByYearResponse | ThesesDashboardErrorResponse>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Metodo nao permitido." });
  }

  const index = process.env.INDEX_PUBLICATION;

  if (!index) {
    logger.error("[dashboard/theses-by-year] INDEX_PUBLICATION is not configured");
    return res.status(500).json({ error: "Servico indisponivel." });
  }

  const maxYear = new Date().getFullYear();

  try {
    const response = await client.search({
      index,
      size: 0,
      query: {
        terms: { type: [...THESIS_TYPES] },
      },
      aggs: {
        by_year: {
          terms: { field: "degreeDate", size: 200, order: { _key: "asc" } },
          aggs: {
            by_type: { terms: { field: "type", size: 10 } },
          },
        },
      },
    });

    const aggregations = response.aggregations as YearAggregations | undefined;
    const byYear = new Map<number, { dissertations: number; theses: number }>();

    for (const bucket of aggregations?.by_year?.buckets ?? []) {
      const year = Number(bucket.key);
      if (!Number.isInteger(year) || year < MIN_YEAR || year > maxYear) continue;
      const typeBuckets = bucket.by_type?.buckets;
      byYear.set(year, {
        dissertations: bucketCount(typeBuckets, "Dissertação"),
        theses: bucketCount(typeBuckets, "Tese"),
      });
    }

    const items: ThesisYearPoint[] = [];
    if (byYear.size > 0) {
      const first = Math.min(...byYear.keys());
      const last = Math.max(...byYear.keys());
      for (let year = first; year <= last; year += 1) {
        const point = byYear.get(year);
        items.push({
          year,
          dissertations: point?.dissertations ?? 0,
          theses: point?.theses ?? 0,
        });
      }
    }

    const lastPoint = items[items.length - 1];
    const previousPoint = items[items.length - 2];
    const lastTotal = lastPoint ? lastPoint.dissertations + lastPoint.theses : 0;
    const previousTotal = previousPoint
      ? previousPoint.dissertations + previousPoint.theses
      : 0;
    const incompleteYear =
      lastPoint && previousPoint && lastTotal < previousTotal * INCOMPLETE_YEAR_RATIO
        ? lastPoint.year
        : null;

    return res.status(200).json({ items, incompleteYear });
  } catch (error: unknown) {
    logger.error("[dashboard/theses-by-year] falha ao carregar o painel");
    logger.error(error);
    return res.status(500).json({ error: "Falha ao carregar o painel." });
  }
}
