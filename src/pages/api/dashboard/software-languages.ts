import type { NextApiRequest, NextApiResponse } from "next";
import { PROGRAMMING_LANGUAGE_FIELD, formatLanguageLabel } from "../../../lib/softwareScripts";
import { createElasticsearchClient } from "../../../services/ElasticsearchClient";
import logger from "../../../services/Logger";
import type {
  SoftwareDashboardErrorResponse,
  SoftwareLanguagesResponse,
} from "../../../types/SoftwareDashboard";

const client = createElasticsearchClient();

const TOP_LANGUAGES = 15;

type LanguageAggregations = {
  with_language?: { doc_count?: number };
  languages?: { buckets?: { key: string; doc_count: number }[] };
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SoftwareLanguagesResponse | SoftwareDashboardErrorResponse>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Metodo nao permitido." });
  }

  const index = process.env.INDEX_SOFTWARE;

  if (!index) {
    logger.error("[dashboard/software-languages] INDEX_SOFTWARE is not configured");
    return res.status(500).json({ error: "Servico indisponivel." });
  }

  try {
    const response = await client.search({
      index,
      size: 0,
      track_total_hits: true,
      runtime_mappings: { programming_language: PROGRAMMING_LANGUAGE_FIELD },
      aggs: {
        with_language: { filter: { exists: { field: "programming_language" } } },
        languages: { terms: { field: "programming_language", size: TOP_LANGUAGES } },
      },
    });

    const aggregations = response.aggregations as LanguageAggregations | undefined;
    const rawTotal = response.hits?.total;

    return res.status(200).json({
      items: (aggregations?.languages?.buckets ?? []).map((bucket) => ({
        name: formatLanguageLabel(bucket.key),
        count: bucket.doc_count,
      })),
      withLanguage: aggregations?.with_language?.doc_count ?? 0,
      total: typeof rawTotal === "number" ? rawTotal : rawTotal?.value ?? 0,
    });
  } catch (error: unknown) {
    logger.error("[dashboard/software-languages] falha ao carregar o painel");
    logger.error(error);
    return res.status(500).json({ error: "Falha ao carregar o painel." });
  }
}
