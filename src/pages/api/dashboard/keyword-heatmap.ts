import type { NextApiRequest, NextApiResponse } from "next";
import { createElasticsearchClient } from "../../../services/ElasticsearchClient";
import logger from "../../../services/Logger";
import { buildPublicationFilterClauses, buildPublicationSearchClause } from "../../../lib/publicationSearch";
import type { PublicationsDashboardErrorResponse, PublicationsDashboardFilters, PublicationsKeywordHeatmap } from "../../../types/PublicationsDashboard";

const client = createElasticsearchClient();
const KEYWORD_SIZE = 100;
// Busca folga no ES para, após unificar variantes, ainda sobrar o top N
const KEYWORD_FETCH_SIZE = 400;
const YEAR_FROM = "1960";
// Recontagem em lotes paralelos: uma consulta única com 100 buscas estoura o timeout
const RECOUNT_BATCH_SIZE = 25;
const RECOUNT_OPTIONS = { requestTimeout: 120000, maxRetries: 0 };

// Função auxiliar para tratar parâmetros da query string
function param(value: string | string[] | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

// Normaliza para agrupamento (caixa + acentos + espaços)
function normalizeKeyword(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/\s+/g, " ")
    .trim();
}

// Preferência de rótulo: variante com maior contagem; empate → mais “Title Case”
function pickDisplayLabel(current: string, candidate: string, currentCount: number, candidateCount: number) {
  if (candidateCount > currentCount) return candidate;
  if (candidateCount < currentCount) return current;

  const currentScore = Number(/[A-ZÁÉÍÓÚÂÊÔÃÕÇ]/.test(current));
  const candidateScore = Number(/[A-ZÁÉÍÓÚÂÊÔÃÕÇ]/.test(candidate));

  return candidateScore > currentScore ? candidate : current;

}

// Agrupa buckets equivalentes semanticamente (ex.: Educação / educação)
function mergeKeywordBuckets(buckets: { key?: unknown; key_as_string?: unknown; doc_count?: number }[]) {
  const merged = new Map<string,{ keyword: string; count: number; topVariantCount: number }>();

  for (const bucket of buckets) {
    const raw = String(bucket.key_as_string ?? bucket.key ?? "").trim();
    if (!raw) continue;

    const key = normalizeKeyword(raw);
    if (!key) continue;

    const count = Number(bucket.doc_count ?? 0);
    const existing = merged.get(key);

    if (!existing) {
      merged.set(key, {
        keyword: raw,
        count,
        topVariantCount: count,
      });
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

// Conta um lote de palavras com a mesma busca da tabela "Listagem das Publicações"
async function countBatch(
  index: string,
  filters: PublicationsDashboardFilters,
  keywords: string[],
) {
  const response = await client.search(
    {
      index,
      size: 0,
      track_total_hits: false,
      query: { bool: { filter: buildPublicationFilterClauses(filters) } },
      aggs: {
        byKeyword: {
          filters: {
            filters: Object.fromEntries(
              keywords.map((keyword, position) => [
                String(position),
                buildPublicationSearchClause(keyword),
              ]),
            ),
          },
        },
      },
    },
    RECOUNT_OPTIONS,
  );

  const buckets = ((response.aggregations as any)?.byKeyword?.buckets ?? {}) as Record<string,{ doc_count?: number }>;

  return keywords.map((keyword, position) => ({
    keyword,
    count: Number(buckets[String(position)]?.doc_count ?? 0),
  }));
}

// Mesma contagem que a tabela mostra ao buscar cada palavra
async function countLikePublicationList(
  index: string,
  filters: PublicationsDashboardFilters,
  keywords: string[],
) {
  const batches: string[][] = [];
  for (let start = 0; start < keywords.length; start += RECOUNT_BATCH_SIZE) {
    batches.push(keywords.slice(start, start + RECOUNT_BATCH_SIZE));
  }

  const counts = (
    await Promise.all(batches.map((batch) => countBatch(index, filters, batch)))
  ).flat();

  return counts
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count || a.keyword.localeCompare(b.keyword, "pt-BR"));
}

// Handler principal para a API
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PublicationsKeywordHeatmap | PublicationsDashboardErrorResponse>,
) {
  // Verifica se o método da requisição é GET
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");

    return res.status(405).json({ error: "Metodo nao permitido." });

  }

  // Obtém o índice de publicações
  const index = process.env.INDEX_PUBLICATION;
  // Verifica se o índice está definido
  if (!index) {
    return res.status(500).json({ error: "Servico indisponivel." });
  }

  // Obtém os parâmetros da query string
  const publicationDate = param(req.query.publicationDate);
  // Obtém o tipo de publicação
  const type = param(req.query.type);
  // Obtém o idioma da publicação
  const language = param(req.query.language);
  // Obtém a instituição da publicação
  const institution = param(req.query.institution);
  // Obtém o ano atual
  const yearTo = String(new Date().getFullYear());

  // Cria o array de filtros (mesmo critério da API /publications)
  const filters: Record<string, unknown>[] = [
    { range: { publicationDate: { gte: YEAR_FROM, lte: yearTo } } },
  ];

  // Adiciona os filtros para a data, tipo, idioma e instituição
  if (publicationDate) filters.push({ term: { publicationDate } });
  if (type) filters.push({ term: { type } });
  if (language) filters.push({ term: { language } });
  if (institution) {
    filters.push({ term: { "sponsorOrgUnit.name": institution } });
  }

  // Realiza a busca nos dados
  try {
    const response = await client.search({
      index,
      size: 0,
      track_total_hits: false,
      query: { bool: { filter: filters } },
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

    // Obtém os buckets de palavras-chave
    const buckets = ((response.aggregations as any)?.byKeyword?.buckets as any[]) ?? [];

    // Mesmas palavras de antes; o número passa a ser o que a tabela mostra ao buscar cada uma
    const words = mergeKeywordBuckets(buckets).map((item) => item.keyword);
    const startedAt = Date.now();
    const items = await countLikePublicationList(
      index,
      { publicationDate, type, language, institution },
      words,
    );
    logger.info(`[keyword-heatmap] recontagem ${Date.now() - startedAt}ms (${words.length} palavras)`);

    return res.status(200).json({ items });

  } catch (error) {
    logger.error(error);
    
    return res.status(500).json({ error: "Falha ao carregar o painel." });

  }
}
