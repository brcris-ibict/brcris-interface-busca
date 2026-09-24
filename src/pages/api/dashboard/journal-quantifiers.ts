import type { NextApiRequest, NextApiResponse } from "next";
import { createElasticsearchClient } from "../../../services/ElasticsearchClient";
import logger from "../../../services/Logger";
import type {
  PublicationsDashboardErrorResponse,
  PublicationsJournalQuantifiers,
} from "../../../types/PublicationsDashboard";

const client = createElasticsearchClient();
const MAX_TITLES = 50;
const DEFAULT_PAGE_SIZE = 10;
const YEAR_FROM = "1960";

// Função auxiliar para tratar parâmetros da query string
function param(value: string | string[] | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

// Função auxiliar para converter parâmetros em inteiros positivos
function parsePositiveInt(
  value: string | string[] | undefined,
  fallback: number,
  max: number,
) {
  const raw = typeof value === "string" ? Number(value) : NaN;

  if (!Number.isFinite(raw) || raw < 1) return fallback;

  return Math.min(Math.floor(raw), max);

}

// Handler principal para a API
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PublicationsJournalQuantifiers | PublicationsDashboardErrorResponse>,
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
  // Obtém a página
  const page = parsePositiveInt(req.query.page, 1, 1000);
  // Obtém o tamanho da página
  const pageSize = parsePositiveInt(
    req.query.pageSize,
    DEFAULT_PAGE_SIZE,
    MAX_TITLES,
  );
  const yearTo = String(new Date().getFullYear());

  // Cria o array de filtros (mesmo critério da API /publications)
  const filters: Record<string, unknown>[] = [
    { range: { publicationDate: { gte: YEAR_FROM, lte: yearTo } } },
  ];

  if (publicationDate) filters.push({ term: { publicationDate } });
  if (type) filters.push({ term: { type } });
  if (language) filters.push({ term: { language } });
  if (institution) {
    filters.push({ term: { "sponsorOrgUnit.name": institution } });
  }

  // terms aggregation não tem from/size: pedimos até o fim da página e fatiamos
  const fetchSize = Math.min(page * pageSize, MAX_TITLES);
  const start = (page - 1) * pageSize;

  if (start >= MAX_TITLES) {
    return res.status(200).json({
      items: [],
      page,
      pageSize,
      total: MAX_TITLES,
    });
  }

  try {
    const response = await client.search({
      index,
      size: 0,
      track_total_hits: false,
      query: { bool: { filter: filters } },
      aggs: {
        byTitle: {
          terms: {
            field: "title",
            size: fetchSize,
            order: { _count: "desc" },
          },
          aggs: {
            conferences: { cardinality: { field: "conference.id" } },
            journals: { cardinality: { field: "journal.id" } },
            authors: { cardinality: { field: "author.id" } },
            sponsors: { cardinality: { field: "sponsorOrgUnit.id" } },
          },
        },
      },
    });

    // Obtém os buckets de títulos
    const buckets = ((response.aggregations as any)?.byTitle?.buckets as any[]) ?? [];

    // Obtém os buckets da página
    const pageBuckets = buckets.slice(start, start + pageSize);

    // Se voltaram menos buckets que o pedido, total real = length; senão, teto MAX_TITLES
    const total = buckets.length < fetchSize ? buckets.length : MAX_TITLES;

    return res.status(200).json({
      items: pageBuckets.map((bucket, index) => ({
        rank: start + index + 1,
        title: String(bucket.key_as_string ?? bucket.key),
        publications: bucket.doc_count,
        conferences: bucket.conferences?.value ?? 0,
        journals: bucket.journals?.value ?? 0,
        authors: bucket.authors?.value ?? 0,
        sponsors: bucket.sponsors?.value ?? 0,
      })),
      page,
      pageSize,
      total,
    });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ error: "Falha ao carregar o painel." });
  }
}
