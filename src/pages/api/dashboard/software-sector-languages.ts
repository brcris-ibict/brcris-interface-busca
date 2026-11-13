import type { NextApiRequest, NextApiResponse } from "next";
import { PROGRAMMING_LANGUAGE_FIELD, formatLanguageLabel } from "../../../lib/softwareScripts";
import { createElasticsearchClient } from "../../../services/ElasticsearchClient";
import logger from "../../../services/Logger";
import type {
  SoftwareDashboardErrorResponse,
  SoftwareSectorLanguageCell,
  SoftwareSectorLanguageResponse,
} from "../../../types/SoftwareDashboard";

const client = createElasticsearchClient();

const TOP_SECTORS = 10;
const TOP_LANGUAGES = 10;
// Teto de linguagens por setor no sub-agrupamento; precisa cobrir as TOP_LANGUAGES em qualquer setor.
const LANGUAGES_PER_SECTOR = 100;

type TermsBucket = { key: string; doc_count: number };

type SectorLanguageAggregations = {
  with_sector?: { doc_count?: number };
  sector_languages?: { languages?: { buckets?: TermsBucket[] } };
  sectors?: { buckets?: (TermsBucket & { languages?: { buckets?: TermsBucket[] } })[] };
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SoftwareSectorLanguageResponse | SoftwareDashboardErrorResponse>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Metodo nao permitido." });
  }

  const index = process.env.INDEX_SOFTWARE;

  if (!index) {
    logger.error("[dashboard/software-sector-languages] INDEX_SOFTWARE is not configured");
    return res.status(500).json({ error: "Servico indisponivel." });
  }

  try {
    const response = await client.search({
      index,
      size: 0,
      track_total_hits: true,
      runtime_mappings: { programming_language: PROGRAMMING_LANGUAGE_FIELD },
      aggs: {
        with_sector: { filter: { exists: { field: "activitySector" } } },
        sector_languages: {
          filter: { exists: { field: "activitySector" } },
          aggs: {
            languages: { terms: { field: "programming_language", size: TOP_LANGUAGES } },
          },
        },
        sectors: {
          terms: { field: "activitySector", size: TOP_SECTORS },
          aggs: {
            languages: { terms: { field: "programming_language", size: LANGUAGES_PER_SECTOR } },
          },
        },
      },
    });

    const aggregations = response.aggregations as SectorLanguageAggregations | undefined;
    const rawTotal = response.hits?.total;
    const topLanguages = (aggregations?.sector_languages?.languages?.buckets ?? []).map(
      (bucket) => bucket.key,
    );
    const topLanguageSet = new Set(topLanguages);

    const cells: SoftwareSectorLanguageCell[] = [];
    const sectors: { name: string; total: number }[] = [];

    for (const sector of aggregations?.sectors?.buckets ?? []) {
      const sectorCells = (sector.languages?.buckets ?? [])
        .filter((bucket) => topLanguageSet.has(bucket.key) && bucket.doc_count > 0)
        .map((bucket) => ({
          sector: sector.key,
          language: formatLanguageLabel(bucket.key),
          count: bucket.doc_count,
        }));
      if (sectorCells.length === 0) continue;
      sectors.push({ name: sector.key, total: sector.doc_count });
      cells.push(...sectorCells);
    }

    const usedLanguages = new Set(cells.map((cell) => cell.language));
    const languages = topLanguages
      .map((key) => formatLanguageLabel(key))
      .filter((label) => usedLanguages.has(label));

    return res.status(200).json({
      sectors,
      languages,
      cells,
      withSector: aggregations?.with_sector?.doc_count ?? 0,
      total: typeof rawTotal === "number" ? rawTotal : rawTotal?.value ?? 0,
    });
  } catch (error: unknown) {
    logger.error("[dashboard/software-sector-languages] falha ao carregar o painel");
    logger.error(error);
    return res.status(500).json({ error: "Falha ao carregar o painel." });
  }
}
