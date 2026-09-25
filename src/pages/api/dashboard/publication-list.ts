import type { NextApiRequest, NextApiResponse } from "next";
import { createElasticsearchClient } from "../../../services/ElasticsearchClient";
import logger from "../../../services/Logger";
import {
  SERVER_PAGE_DEFAULT_SIZE,
  SERVER_PAGE_MAX_SIZE,
  SERVER_RESULT_WINDOW,
  parsePositiveInt,
} from "../../../lib/serverPagination";
import type {
  PublicationsDashboardErrorResponse,
  PublicationsDashboardFilters,
  PublicationsListItem,
  PublicationsListResponse,
} from "../../../types/PublicationsDashboard";

const client = createElasticsearchClient();
const YEAR_FROM = 1960;

// Campos do documento ES para o source
const SOURCE_FIELDS = [
  "title",
  "author",
  "journal",
  "conference",
  "doi",
  "accessType",
  "sponsorOrgUnit",
] as const;

// Página máxima dentro da janela from+size do ES
const MAX_PAGE = Math.ceil(SERVER_RESULT_WINDOW / SERVER_PAGE_DEFAULT_SIZE);

// Função auxiliar para tratar parâmetros da query string
function param(value: string | string[] | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

// Função auxiliar para obter os filtros da query string
function getFilters(req: NextApiRequest): PublicationsDashboardFilters {
  return {
    publicationDate: param(req.query.publicationDate),
    type: param(req.query.type),
    language: param(req.query.language),
    institution: param(req.query.institution),
  };
}

// Função auxiliar para construir a query do Elasticsearch
function buildQuery(filters: PublicationsDashboardFilters) {
  const yearTo = String(new Date().getFullYear());
  const filterClauses: Record<string, unknown>[] = [
    {
      range: {
        publicationDate: { gte: String(YEAR_FROM), lte: yearTo },
      },
    },
  ];

  if (filters.publicationDate) {
    filterClauses.push({ term: { publicationDate: filters.publicationDate } });
  }
  if (filters.type) {
    filterClauses.push({ term: { type: filters.type } });
  }
  if (filters.language) {
    filterClauses.push({ term: { language: filters.language } });
  }
  if (filters.institution) {
    filterClauses.push({
      term: { "sponsorOrgUnit.name": filters.institution },
    });
  }

  return { bool: { filter: filterClauses } };
}

// Função auxiliar para ler um campo do source
function readField(source: Record<string, unknown>, path: string): unknown {
  const parts = path.split(".");
  let current: unknown = source;

  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

// Função auxiliar para formatar o label de um objeto
function formatObjectLabel(item: Record<string, unknown>): string {
  if (item.name != null && String(item.name).trim()) {
    return String(item.name).trim();
  }

  if (item.title != null && String(item.title).trim()) {
    return String(item.title).trim();
  }

  return "";
  // Retorna uma string vazia se o nome ou o título não forem encontrados
}

// Função auxiliar para formatar uma célula da tabela
function formatCell(value: unknown): string {
  if (value == null || value === "") return "—";
  if (Array.isArray(value)) {
    const parts = value
      .flatMap((item) => {
        if (item == null) return [];
        if (typeof item === "object") {
          const label = formatObjectLabel(item as Record<string, unknown>);
          return label ? [label] : [];
        }
        return [String(item)];
      })
      .map((part) => part.trim())
      .filter(Boolean);

    return parts.length > 0 ? parts.join(", ") : "—";

  }
  if (typeof value === "object") {
    const label = formatObjectLabel(value as Record<string, unknown>);
    return label || "—";

  }

  const text = String(value).trim();
  return text || "—";

}

// Função auxiliar para mapear um hit do Elasticsearch para um item da lista
function mapHit(hit: any): PublicationsListItem {
  const source = (hit?._source ?? {}) as Record<string, unknown>;

  return {
    id: String(hit?._id ?? ""),
    title: formatCell(readField(source, "title")),
    authors: formatCell(readField(source, "author")),
    journal: formatCell(readField(source, "journal")),
    conference: formatCell(readField(source, "conference")),
    doi: formatCell(readField(source, "doi")),
    accessType: formatCell(readField(source, "accessType")),
    funding: formatCell(readField(source, "sponsorOrgUnit")),
  };
}

// Handler: listagem paginada de publicações (documentos, milhões de registros)
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PublicationsListResponse | PublicationsDashboardErrorResponse> // Resposta da API
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");

    return res.status(405).json({ error: "Metodo nao permitido." });

  }

  const index = process.env.INDEX_PUBLICATION;
  // Verifica se o índice de publicações está definido
  if (!index) {
    return res.status(500).json({ error: "Servico indisponivel." });
  }

  const filters = getFilters(req);
  const page = parsePositiveInt(req.query.page, 1, MAX_PAGE);
  const pageSize = parsePositiveInt(
    req.query.pageSize,
    SERVER_PAGE_DEFAULT_SIZE,
    SERVER_PAGE_MAX_SIZE,
  );
  // Total conhecido de registros (página anterior)
  const knownTotal = parsePositiveInt(
    req.query.knownTotal,
    0,
    Number.MAX_SAFE_INTEGER,
  );

  // Offset para a consulta do Elasticsearch
  const from = (page - 1) * pageSize;

  // Respeita a janela máxima do Elasticsearch
  if (from + pageSize > SERVER_RESULT_WINDOW) {
    return res.status(400).json({
      error: `Pagina fora da janela permitida (max ${SERVER_RESULT_WINDOW} registros).`,
    });
  }

  try {
    const response = await client.search({
      index,
      from,
      size: pageSize,
      // Mesmo critério do painel / BigNumber
      track_total_hits: knownTotal < 1 ? true : false,
      _source: [...SOURCE_FIELDS],
      query: buildQuery(filters),
      // Sem _id (proibido/instável no ES moderno). _doc = barato e estável na página.
      sort: [
        { publicationDate: { order: "desc", unmapped_type: "keyword" } },
        { _doc: { order: "asc" } },
      ],
    });

    const rawTotal = response.hits.total;
    const exactTotal =
      typeof rawTotal === "number" ? rawTotal : Number(rawTotal?.value ?? 0);
    const total = knownTotal > 0 ? knownTotal : exactTotal;

    const items = ((response.hits.hits as any[]) ?? []).map(mapHit);

    return res.status(200).json({
      items,
      page,
      pageSize,
      total, // total real filtrado → UI: ceil(total / pageSize)
    });
  } catch (error) {
    logger.error(error);
    
    return res.status(500).json({ error: "Falha ao carregar o painel." });

  }
}
