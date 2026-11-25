import type { NextApiRequest, NextApiResponse } from "next";
import { createElasticsearchClient } from "../../../services/ElasticsearchClient";
import logger from "../../../services/Logger";
import type {
  ThesesDashboardErrorResponse,
  ThesisKeywordsResponse,
} from "../../../types/ThesesDashboard";

const client = createElasticsearchClient();

const KEYWORD_SIZE = 50;
const KEYWORD_FETCH_SIZE = 200;

// Tipos do recorte Kibana (PT + EN)
const THESIS_TYPES = [
  "Tese",
  "Dissertação",
  "doctoral thesis",
  "master thesis",
  "bachelor thesis",
  "dissertation",
] as const;

type KeywordBucket = {
  key?: unknown;
  key_as_string?: unknown;
  doc_count?: number;
};

function normalizeKeyword(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/\s+/g, " ")
    .trim();
}

function pickDisplayLabel(
  current: string,
  candidate: string,
  currentCount: number,
  candidateCount: number,
) {
  if (candidateCount > currentCount) return candidate;
  if (candidateCount < currentCount) return current;
  const currentScore = Number(/[A-ZÁÉÍÓÚÂÊÔÃÕÇ]/.test(current));
  const candidateScore = Number(/[A-ZÁÉÍÓÚÂÊÔÃÕÇ]/.test(candidate));
  return candidateScore > currentScore ? candidate : current;
}

function mergeKeywordBuckets(buckets: KeywordBucket[]) {
  const merged = new Map<string, { keyword: string; count: number; topVariantCount: number }>();

  for (const bucket of buckets) {
    const raw = String(bucket.key_as_string ?? bucket.key ?? "").trim();
    if (!raw) continue;
    const key = normalizeKeyword(raw);
    if (!key) continue;

    const count = Number(bucket.doc_count ?? 0);
    const existing = merged.get(key);

    if (!existing) {
      merged.set(key, { keyword: raw, count, topVariantCount: count });
      continue;
    }

    existing.keyword = pickDisplayLabel(
      existing.keyword,
      raw,
      existing.topVariantCount,
      count,
    );
    existing.topVariantCount = Math.max(existing.topVariantCount, count);
    existing.count += count;
  }

  return Array.from(merged.values())
    .sort((a, b) => b.count - a.count || a.keyword.localeCompare(b.keyword, "pt-BR"))
    .slice(0, KEYWORD_SIZE)
    .map(({ keyword, count }) => ({ keyword, count }));
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ThesisKeywordsResponse | ThesesDashboardErrorResponse>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Metodo nao permitido." });
  }

  const index = process.env.INDEX_PUBLICATION;

  if (!index) {
    logger.error("[dashboard/theses-keywords] INDEX_PUBLICATION is not configured");
    return res.status(500).json({ error: "Servico indisponivel." });
  }

  try {
    const response = await client.search({
      index,
      size: 0,
      track_total_hits: false,
      query: {
        terms: { type: [...THESIS_TYPES] },
      },
      aggs: {
        byKeyword: {
          terms: {
            field: "keywords",
            size: KEYWORD_FETCH_SIZE,
            order: { _count: "desc" },
          },
        },
      },
    });

    const buckets =
      ((response.aggregations as { byKeyword?: { buckets?: KeywordBucket[] } } | undefined)
        ?.byKeyword?.buckets as KeywordBucket[]) ?? [];

    return res.status(200).json({ items: mergeKeywordBuckets(buckets) });
  } catch (error: unknown) {
    logger.error("[dashboard/theses-keywords] falha ao carregar o painel");
    logger.error(error);
    return res.status(500).json({ error: "Falha ao carregar o painel." });
  }
}
