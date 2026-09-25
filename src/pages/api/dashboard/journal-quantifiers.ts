import type { NextApiRequest, NextApiResponse } from "next";
import { createElasticsearchClient } from "../../../services/ElasticsearchClient";
import logger from "../../../services/Logger";
import {
  SERVER_PAGE_DEFAULT_SIZE,
  SERVER_PAGE_MAX_SIZE,
  SERVER_TERMS_FETCH_CAP,
  navigableTotal,
  parsePositiveInt,
  termsFetchSize,
} from "../../../lib/serverPagination";
import type {
  PublicationsDashboardErrorResponse,
  PublicationsJournalQuantifiers,
} from "../../../types/PublicationsDashboard";

const client = createElasticsearchClient();
const YEAR_FROM = "1960";
// Página máxima possível com o cap de terms (ex.: 10000/10 = 1000)
const MAX_PAGE = Math.ceil(SERVER_TERMS_FETCH_CAP / SERVER_PAGE_DEFAULT_SIZE);
// Abaixo disso, 1 query com métricas aninhadas ainda é barato
const SINGLE_QUERY_MAX_FETCH = 50;

// Função auxiliar para tratar parâmetros da query string
function param(value: string | string[] | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

// Sub-aggs: usadas na página (ou no terms curto da single-query)
const PAGE_METRIC_AGGS = {
  conferences: { cardinality: { field: "conference.id" } },
  journals: { cardinality: { field: "journal.id" } },
  authors: { cardinality: { field: "author.id" } },
  sponsors: { cardinality: { field: "sponsorOrgUnit.id" } },
};

function mapBucket(bucket: any, rank: number, metrics?: any) {
  return {
    rank,
    title: String(bucket.key_as_string ?? bucket.key),
    publications: bucket.doc_count,
    conferences: (metrics ?? bucket).conferences?.value ?? 0,
    journals: (metrics ?? bucket).journals?.value ?? 0,
    authors: (metrics ?? bucket).authors?.value ?? 0,
    sponsors: (metrics ?? bucket).sponsors?.value ?? 0,
  };
}

// Handler principal para a API
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<
    PublicationsJournalQuantifiers | PublicationsDashboardErrorResponse
  >,
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
  const page = parsePositiveInt(req.query.page, 1, MAX_PAGE);
  // Obtém o tamanho da página (UI / lote; distinto do cap de terms)
  const pageSize = parsePositiveInt(
    req.query.pageSize,
    SERVER_PAGE_DEFAULT_SIZE,
    SERVER_PAGE_MAX_SIZE,
  );
  // Total já conhecido pelo cliente (troca de página sem mudar filtro)
  const knownTotal = parsePositiveInt(
    req.query.knownTotal,
    0,
    SERVER_TERMS_FETCH_CAP,
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
  const fetchSize = termsFetchSize(page, pageSize);
  const start = (page - 1) * pageSize;
  const query = { bool: { filter: filters } };
  const needCardinality = knownTotal < 1;

  try {
    // Caminho rápido: páginas iniciais (fetchSize pequeno) → 1 round-trip
    if (fetchSize <= SINGLE_QUERY_MAX_FETCH) {
      const response = await client.search({
        index,
        size: 0,
        track_total_hits: false,
        query,
        aggs: {
          ...(needCardinality
            ? {
                titleCount: {
                  cardinality: {
                    field: "title",
                    precision_threshold: 3000,
                  },
                },
              }
            : {}),
          byTitle: {
            terms: {
              field: "title",
              size: fetchSize,
              order: { _count: "desc" },
              shard_size: fetchSize,
            },
            aggs: PAGE_METRIC_AGGS,
          },
        },
      });

      const aggs = response.aggregations as any;
      const total = needCardinality
        ? navigableTotal(Number(aggs?.titleCount?.value ?? 0))
        : knownTotal;

      if (start >= total) {
        return res.status(200).json({ items: [], page, pageSize, total });
      }

      const buckets = (aggs?.byTitle?.buckets as any[]) ?? [];
      const pageBuckets = buckets.slice(start, start + pageSize);

      return res.status(200).json({
        items: pageBuckets.map((bucket, index) =>
          mapBucket(bucket, start + index + 1),
        ),
        page,
        pageSize,
        total,
      });
    }

    // Caminho profundo: ranking leve + métricas só da página
    const rankResponse = await client.search({
      index,
      size: 0,
      track_total_hits: false,
      query,
      aggs: {
        ...(needCardinality
          ? {
              titleCount: {
                cardinality: {
                  field: "title",
                  precision_threshold: 3000,
                },
              },
            }
          : {}),
        byTitle: {
          terms: {
            field: "title",
            size: fetchSize,
            order: { _count: "desc" },
            shard_size: fetchSize,
          },
        },
      },
    });

    const rankAggs = rankResponse.aggregations as any;
    const total = needCardinality
      ? navigableTotal(Number(rankAggs?.titleCount?.value ?? 0))
      : knownTotal;

    if (start >= total) {
      return res.status(200).json({ items: [], page, pageSize, total });
    }

    const buckets = (rankAggs?.byTitle?.buckets as any[]) ?? [];
    const pageBuckets = buckets.slice(start, start + pageSize);
    const pageTitles = pageBuckets.map((bucket) =>
      String(bucket.key_as_string ?? bucket.key),
    );

    if (pageTitles.length === 0) {
      return res.status(200).json({ items: [], page, pageSize, total });
    }

    const metricsResponse = await client.search({
      index,
      size: 0,
      track_total_hits: false,
      query,
      aggs: {
        byTitlePage: {
          terms: {
            field: "title",
            include: pageTitles,
            size: pageTitles.length,
          },
          aggs: PAGE_METRIC_AGGS,
        },
      },
    });

    const metricBuckets =
      ((metricsResponse.aggregations as any)?.byTitlePage?.buckets as any[]) ??
      [];
    const metricsByTitle = new Map(
      metricBuckets.map((bucket) => [
        String(bucket.key_as_string ?? bucket.key),
        bucket,
      ]),
    );

    return res.status(200).json({
      items: pageBuckets.map((bucket, index) => {
        const title = String(bucket.key_as_string ?? bucket.key);
        return mapBucket(
          bucket,
          start + index + 1,
          metricsByTitle.get(title),
        );
      }),
      page,
      pageSize,
      total,
    });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ error: "Falha ao carregar o painel." });
  }
}
