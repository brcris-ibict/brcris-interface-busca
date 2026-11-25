import type { NextApiRequest, NextApiResponse } from "next";
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
  ThesesDashboardErrorResponse,
  ThesisListItem,
  ThesisListResponse,
} from "../../../types/ThesesDashboard";

const client = createElasticsearchClient();

const THESIS_TYPES = ["Tese", "Dissertação"] as const;

const SOURCE_FIELDS = [
  "id",
  "title",
  "type",
  "degreeDate",
  "advisor",
  "sponsorOrgUnit",
  "course",
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

function formatObjectLabel(item: Record<string, unknown>): string {
  if (item.name != null && String(item.name).trim()) {
    return String(item.name).trim();
  }
  if (item.title != null && String(item.title).trim()) {
    return String(item.title).trim();
  }
  return "";
}

function formatCell(value: unknown): string {
  if (value == null || value === "") return "";
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
    return [...new Set(parts)].join(", ");
  }
  if (typeof value === "object") {
    return formatObjectLabel(value as Record<string, unknown>);
  }
  return String(value).trim();
}

function pickYear(values: string[]) {
  const years = values
    .map((value) => {
      const match = /(\d{4})/.exec(value);
      return match ? Number(match[1]) : NaN;
    })
    .filter((year) => Number.isFinite(year) && year >= 1900 && year <= 2100);
  if (years.length === 0) return "";
  return String(Math.max(...years));
}

function mapHit(hit: RawHit): ThesisListItem {
  const source = hit._source ?? {};
  const urls = asStrings(source.resourceUrl).filter((url) => url.startsWith("http"));
  const id = String(source.id ?? hit._id ?? "");

  return {
    id,
    title: asStrings(source.title)[0] || formatCell(source.title) || "—",
    type: asStrings(source.type)[0] || "—",
    year: pickYear(asStrings(source.degreeDate)),
    advisor: formatCell(source.advisor) || "—",
    institution: formatCell(source.sponsorOrgUnit) || "—",
    course: formatCell(source.course) || "—",
    url: urls[0] ?? "",
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ThesisListResponse | ThesesDashboardErrorResponse>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Metodo nao permitido." });
  }

  const index = process.env.INDEX_PUBLICATION;

  if (!index) {
    logger.error("[dashboard/theses-list] INDEX_PUBLICATION is not configured");
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
    return res.status(400).json({
      error: `Pagina fora da janela permitida (max ${SERVER_RESULT_WINDOW} registros).`,
    });
  }

  const filter: Record<string, unknown>[] = [{ terms: { type: [...THESIS_TYPES] } }];

  const query = search
    ? {
        bool: {
          filter,
          must: [
            {
              simple_query_string: {
                query: search,
                fields: [
                  "title_text^3",
                  "advisor.name_text",
                  "course.name",
                  "sponsorOrgUnit.name",
                ],
                default_operator: "and",
                lenient: true,
              },
            },
          ],
        },
      }
    : { bool: { filter } };

  try {
    const response = await client.search({
      index,
      from,
      size: pageSize,
      track_total_hits: knownTotal < 1,
      _source: [...SOURCE_FIELDS],
      query,
      sort: search
        ? [{ _score: { order: "desc" } }, { degreeDate: { order: "desc", missing: "_last" } }]
        : [{ degreeDate: { order: "desc", missing: "_last" } }, { _doc: { order: "asc" } }],
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
    logger.error(`[dashboard/theses-list] falha na consulta (q="${search}")`);
    logger.error(error);
    return res.status(500).json({ error: "Falha ao carregar o painel." });
  }
}
