import type { NextApiRequest, NextApiResponse } from "next";
import { createElasticsearchClient } from "../../../services/ElasticsearchClient";
import logger from "../../../services/Logger";
import type { estypes } from "es8";
import type {
  ProgramsDashboardErrorResponse,
  ProgramsTermPoint,
  ProgramsTermsResponse,
} from "../../../types/ProgramsDashboard";

const client = createElasticsearchClient();

type TermBucket = {
  key: string | number;
  doc_count: number;
};

type Grouping = {
  agg: estypes.AggregationsAggregationContainer;
  parse: (aggregation: unknown) => ProgramsTermPoint[];
};

function termsGrouping(field: string, size: number): Grouping {
  return {
    agg: { terms: { field, order: { _count: "desc" }, size } },
    parse: (aggregation) =>
      ((aggregation as { buckets?: TermBucket[] } | undefined)?.buckets ?? []).map((bucket) => ({
        name: String(bucket.key).trim(),
        count: bucket.doc_count,
      })),
  };
}

// Faixas de nº de instituições por programa; os nomes são chaves de tradução
const NETWORK_SIZES = [
  { key: "Network size 2", script: "doc['orgUnit.name'].size() == 2" },
  { key: "Network size 3-4", script: "doc['orgUnit.name'].size() >= 3 && doc['orgUnit.name'].size() <= 4" },
  { key: "Network size 5-9", script: "doc['orgUnit.name'].size() >= 5 && doc['orgUnit.name'].size() <= 9" },
  { key: "Network size 10+", script: "doc['orgUnit.name'].size() >= 10" },
];

// Só estes agrupamentos podem ser consultados pela query string
const GROUPINGS: Record<string, Grouping> = {
  capesArea: termsGrouping("capesArea", 10),
  institution: termsGrouping("orgUnit.name", 5),
  networkSize: {
    agg: {
      filters: {
        filters: Object.fromEntries(
          NETWORK_SIZES.map((range) => [range.key, { script: { script: range.script } }]),
        ),
      },
    },
    parse: (aggregation) => {
      const buckets = (aggregation as { buckets?: Record<string, { doc_count?: number }> } | undefined)
        ?.buckets;
      return NETWORK_SIZES.map((range) => ({ name: range.key, count: buckets?.[range.key]?.doc_count ?? 0 }));
    },
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ProgramsTermsResponse | ProgramsDashboardErrorResponse>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Metodo nao permitido." });
  }

  const grouping = GROUPINGS[String(req.query.by ?? "")];
  if (!grouping) {
    return res.status(400).json({ error: "Agrupamento invalido." });
  }

  const index = process.env.INDEX_PROGRAM;

  if (!index) {
    logger.error("[dashboard/programs-terms] INDEX_PROGRAM is not configured");
    return res.status(500).json({ error: "Servico indisponivel." });
  }

  try {
    const response = await client.search({
      index,
      size: 0,
      aggs: { by_term: grouping.agg },
    });

    return res.status(200).json({
      items: grouping.parse((response.aggregations as Record<string, unknown> | undefined)?.by_term),
    });
  } catch (error: unknown) {
    logger.error(`[dashboard/programs-terms] falha ao carregar o painel (by=${req.query.by})`);
    logger.error(error);
    return res.status(500).json({ error: "Falha ao carregar o painel." });
  }
}
