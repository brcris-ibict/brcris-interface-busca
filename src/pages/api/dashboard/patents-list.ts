import type { NextApiRequest, NextApiResponse } from "next";
import { PATENT_DEPOSIT_SORT_SCRIPT } from "../../../lib/patentScripts";
import {
  SERVER_PAGE_DEFAULT_SIZE,
  SERVER_PAGE_MAX_SIZE,
  SERVER_RESULT_WINDOW,
  parsePositiveInt,
} from "../../../lib/serverPagination";
import { SEARCH_MAX_LENGTH, SEARCH_MIN_LENGTH } from "../../../lib/textSearch";
import { createElasticsearchClient } from "../../../services/ElasticsearchClient";
import logger from "../../../services/Logger";
import type {
  PatentListItem,
  PatentListResponse,
  PatentsDashboardErrorResponse,
} from "../../../types/PatentsDashboard";

const client = createElasticsearchClient();

const SOURCE_FIELDS = [
  "id",
  "title",
  "depositDate",
  "kindCode",
  "inventor.name",
  "IPCclassification",
  "resourceUrl",
] as const;

const MAX_PAGE = Math.ceil(SERVER_RESULT_WINDOW / SERVER_PAGE_DEFAULT_SIZE);

type RawHit = { _id?: string; _source?: Record<string, unknown> };

function param(value: string | string[] | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

function asStrings(value: unknown): string[] {
  if (value == null) return [];
  const list = Array.isArray(value) ? value : [value];
  return list.map((item) => String(item).trim()).filter(Boolean);
}

// Escolhe a data de depósito mais antiga (campo multivalorado em alguns registros).
function earliestDeposit(values: string[]) {
  let best = "";
  let bestKey = Number.POSITIVE_INFINITY;

  for (const raw of values) {
    const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(raw);
    if (!match) continue;
    const key = Number(match[3]) * 10000 + Number(match[2]) * 100 + Number(match[1]);
    if (key < bestKey) {
      bestKey = key;
      best = raw;
    }
  }

  return best || values[0] || "";
}

function inventorNames(value: unknown) {
  if (!Array.isArray(value)) return "";
  const names = value.flatMap((item) => {
    if (item == null || typeof item !== "object") return [];
    return asStrings((item as { name?: unknown }).name);
  });
  return [...new Set(names)].join(", ");
}

function mapHit(hit: RawHit): PatentListItem {
  const source = hit._source ?? {};
  const urls = asStrings(source.resourceUrl).filter((url) => url.startsWith("http"));

  return {
    id: String(source.id ?? hit._id ?? ""),
    title: asStrings(source.title)[0] ?? "",
    depositDate: earliestDeposit(asStrings(source.depositDate)),
    kindCodes: asStrings(source.kindCode),
    inventors: inventorNames(source.inventor),
    ipc: asStrings(source.IPCclassification).join(", "),
    url: urls[0] ?? "",
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PatentListResponse | PatentsDashboardErrorResponse>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Metodo nao permitido." });
  }

  const index = process.env.INDEX_PATENT;

  if (!index) {
    logger.error("[dashboard/patents-list] INDEX_PATENT is not configured");
    return res.status(500).json({ error: "Servico indisponivel." });
  }

  const rawSearch = param(req.query.q);
  if (rawSearch.length > SEARCH_MAX_LENGTH) {
    return res.status(400).json({ error: `Busca muito longa (max ${SEARCH_MAX_LENGTH} caracteres).` });
  }

  const search = rawSearch.length >= SEARCH_MIN_LENGTH ? rawSearch : "";
  const page = parsePositiveInt(req.query.page, 1, MAX_PAGE);
  const pageSize = parsePositiveInt(req.query.pageSize, SERVER_PAGE_DEFAULT_SIZE, SERVER_PAGE_MAX_SIZE);
  const knownTotal = parsePositiveInt(req.query.knownTotal, 0, Number.MAX_SAFE_INTEGER);
  const from = (page - 1) * pageSize;

  if (from + pageSize > SERVER_RESULT_WINDOW) {
    return res.status(400).json({ error: `Pagina fora da janela permitida (max ${SERVER_RESULT_WINDOW} registros).` });
  }

  try {
    const response = await client.search({
      index,
      from,
      size: pageSize,
      track_total_hits: knownTotal < 1,
      _source: [...SOURCE_FIELDS],
      runtime_mappings: {
        deposit_sort: { type: "long", script: { source: PATENT_DEPOSIT_SORT_SCRIPT } },
      },
      query: search
        ? {
            simple_query_string: {
              query: search,
              fields: ["title_text^3", "inventor.name_text"],
              default_operator: "and",
              lenient: true,
            },
          }
        : { match_all: {} },
      sort: search
        ? [{ _score: { order: "desc" } }, { deposit_sort: { order: "desc", missing: "_last" } }]
        : [{ deposit_sort: { order: "desc", missing: "_last" } }, { _doc: { order: "asc" } }],
    });

    const rawTotal = response.hits.total;
    const exactTotal = typeof rawTotal === "number" ? rawTotal : Number(rawTotal?.value ?? 0);

    return res.status(200).json({
      items: ((response.hits.hits ?? []) as RawHit[]).map(mapHit),
      page,
      pageSize,
      total: knownTotal > 0 ? knownTotal : exactTotal,
    });
  } catch (error: unknown) {
    logger.error(`[dashboard/patents-list] falha na consulta (q="${search}")`);
    logger.error(error);
    return res.status(500).json({ error: "Falha ao carregar o painel." });
  }
}
