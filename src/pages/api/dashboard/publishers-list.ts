import type { NextApiRequest, NextApiResponse } from "next";
import { createElasticsearchClient } from "../../../services/ElasticsearchClient";
import logger from "../../../services/Logger";
import {
  SERVER_PAGE_DEFAULT_SIZE,
  SERVER_PAGE_MAX_SIZE,
  SERVER_RESULT_WINDOW,
  parsePositiveInt,
} from "../../../lib/serverPagination";
import { SEARCH_MAX_LENGTH, SEARCH_MIN_LENGTH } from "../../../lib/textSearch";
import type {
  PeopleDashboardErrorResponse,
  PublishersListItem,
  PublishersListResponse,
} from "../../../types/PeopleDashboard";

const client = createElasticsearchClient();

const SOURCE_FIELDS = ["name", "affiliation.name", "researchArea", "lattesId", "orcid"];

const MAX_PAGE = Math.ceil(SERVER_RESULT_WINDOW / SERVER_PAGE_DEFAULT_SIZE);

// Calculados só para os hits da página: ordenar por eles exige script sort, inviável em ~1,2 mi de docs
const SCRIPT_FIELDS = {
  publications: { script: { source: "doc['authorOf.id'].size()" } },
  firstPublication: {
    script: {
      source: "def d = doc['authorOf.publicationDate']; d.size() == 0 ? '' : d[0]",
    },
  },
  lastPublication: {
    script: {
      source:
        "def d = doc['authorOf.publicationDate']; d.size() == 0 ? '' : d[d.size() - 1]",
    },
  },
};

function param(value: string | string[] | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

function asStrings(value: unknown): string[] {
  if (value == null) return [];
  const list = Array.isArray(value) ? value : [value];
  return list.map((item) => String(item ?? "").trim()).filter(Boolean);
}

function firstAffiliation(value: unknown): string {
  const list = Array.isArray(value) ? value : value ? [value] : [];
  for (const item of list) {
    const name = asStrings((item as { name?: unknown })?.name)[0];
    if (name) return name;
  }
  return "";
}

// researchArea vem como "Grande área / Área / Subárea"; escolhe a grande área mais citada
function mainMajorArea(value: unknown): string {
  const counts = new Map<string, number>();
  asStrings(value).forEach((area) => {
    const major = area.split("/")[0].trim();
    if (major) counts.set(major, (counts.get(major) ?? 0) + 1);
  });

  let best = "";
  let bestCount = 0;
  counts.forEach((count, major) => {
    if (count > bestCount) {
      best = major;
      bestCount = count;
    }
  });
  return best;
}

function scriptValue(fields: Record<string, unknown[]> | undefined, key: string) {
  return fields?.[key]?.[0];
}

function mapHit(hit: any): PublishersListItem {
  const source = (hit?._source ?? {}) as Record<string, unknown>;
  const fields = hit?.fields as Record<string, unknown[]> | undefined;
  const lattesIds = asStrings(source.lattesId);

  return {
    id: String(hit?._id ?? ""),
    name: asStrings(source.name)[0] ?? "",
    publications: Number(scriptValue(fields, "publications") ?? 0),
    mainAffiliation: firstAffiliation(source.affiliation),
    majorArea: mainMajorArea(source.researchArea),
    lattesId: lattesIds.find((id) => !id.includes("::")) ?? "",
    orcid: asStrings(source.orcid)[0] ?? "",
    lastPublication: String(scriptValue(fields, "lastPublication") ?? ""),
    firstPublication: String(scriptValue(fields, "firstPublication") ?? ""),
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PublishersListResponse | PeopleDashboardErrorResponse>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Metodo nao permitido." });
  }

  const index = process.env.INDEX_PERSON;
  if (!index) {
    logger.error("[publishers-list] INDEX_PERSON is not configured");
    return res.status(500).json({ error: "Servico indisponivel." });
  }

  const rawSearch = param(req.query.q);
  if (rawSearch.length > SEARCH_MAX_LENGTH) {
    return res.status(400).json({
      error: `Busca muito longa (max ${SEARCH_MAX_LENGTH} caracteres).`,
    });
  }
  const search = rawSearch.length >= SEARCH_MIN_LENGTH ? rawSearch : "";
  const page = parsePositiveInt(req.query.page, 1, MAX_PAGE);
  const pageSize = parsePositiveInt(
    req.query.pageSize,
    SERVER_PAGE_DEFAULT_SIZE,
    SERVER_PAGE_MAX_SIZE,
  );
  const knownTotal = parsePositiveInt(req.query.knownTotal, 0, Number.MAX_SAFE_INTEGER);
  const from = (page - 1) * pageSize;

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
      track_total_hits: knownTotal < 1,
      _source: SOURCE_FIELDS,
      script_fields: SCRIPT_FIELDS,
      query: {
        bool: {
          filter: [{ exists: { field: "authorOf" } }],
          ...(search
            ? { must: [{ match: { name_text: { query: search, operator: "and" } } }] }
            : {}),
        },
      },
      sort: search
        ? [{ _score: { order: "desc" } }, { name: { order: "asc" } }]
        : [{ name: { order: "asc" } }],
    });

    const rawTotal = response.hits.total;
    const exactTotal =
      typeof rawTotal === "number" ? rawTotal : Number(rawTotal?.value ?? 0);

    return res.status(200).json({
      items: ((response.hits.hits as any[]) ?? []).map(mapHit),
      page,
      pageSize,
      total: knownTotal > 0 ? knownTotal : exactTotal,
    });
  } catch (error) {
    logger.error(`[publishers-list] falha na consulta (q="${search}")`);
    logger.error(error);
    return res.status(500).json({ error: "Falha ao carregar o painel." });
  }
}
