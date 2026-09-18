import type { NextApiRequest, NextApiResponse } from "next";
import { createElasticsearchClient } from "../../../services/ElasticsearchClient";
import logger from "../../../services/Logger";
import type {
  PublicationsDashboardErrorResponse,
  PublicationsKeywordHeatmap,
} from "../../../types/PublicationsDashboard";

const client = createElasticsearchClient();
const KEYWORD_SIZE = 30;
const YEAR_FROM = "1960";

const TYPES = [
  "conference proceedings",
  "journal article",
  "article",
  "book",
  "book-chapter",
  "editorial",
  "dataset",
  "erratum",
  "Artigo",
  "Artigo de Conferência",
  "Capítulo de Livro",
  "Conjunto de Dados",
  "Livro",
  "Preprint",
];

// Função auxiliar para tratar parâmetros da query string
function param(value: string | string[] | undefined) {
  return typeof value === "string" ? value.trim() : "";
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

  // Cria o array de filtros
  const filters: Record<string, unknown>[] = [
    { range: { publicationDate: { gte: YEAR_FROM, lte: yearTo } } },
    {
      bool: {
        should: TYPES.map((value) => ({ term: { type: value } })),
        minimum_should_match: 1,
      },
    },
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
            size: KEYWORD_SIZE,
            order: { _count: "desc" },
          },
        },
      },
    });

    // Obtém os buckets de palavras-chave
    const buckets = ((response.aggregations as any)?.byKeyword?.buckets as any[]) ?? [];

    // Retorna os resultados
    return res.status(200).json({
      items: buckets.map((bucket) => ({
        keyword: String(bucket.key_as_string ?? bucket.key),
        count: bucket.doc_count,
      })),
    });

  } catch (error) {
    logger.error(error);
    
    return res.status(500).json({ error: "Falha ao carregar o painel." });

  }
}
