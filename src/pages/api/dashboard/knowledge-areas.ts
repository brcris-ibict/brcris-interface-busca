import type { NextApiRequest, NextApiResponse } from "next";
import { createElasticsearchClient } from "../../../services/ElasticsearchClient";
import logger from "../../../services/Logger";
import type {
  KnowledgeAreaItem,
  KnowledgeAreasErrorResponse,
  KnowledgeAreasResponse,
} from "../../../types/KnowledgeAreas";
import type { PublicationsDashboardFilters } from "../../../types/PublicationsDashboard";

const client = createElasticsearchClient();
const PATH_SEPARATOR = " / ";
const PATH_TERMS_SIZE = 5000;
const MAX_AREAS = 100;
const OTHER_THRESHOLD_SHARE = 0.015;
const OTHER_KEY = "__other__";
const CACHE_TTL_MS = 10 * 60 * 1000;
// Painel interativo: melhor falhar rápido do que segurar a tela por minutos
const QUERY_OPTIONS = { requestTimeout: 30000, maxRetries: 1 };
const MAX_FILTER_LENGTH = 200;
const CACHE_MAX_ENTRIES = 500;
const FILTER_KEYS: FilterKey[] = ["publicationDate", "type", "language", "institution"];
// O cadastro de pesquisadores não tem idioma das publicações
const UNSUPPORTED_FILTERS: FilterKey[] = ["language"];

type FilterKey = keyof PublicationsDashboardFilters;

// Dados do índice de pessoas mudam pouco; evita repetir as consultas a cada clique
const cache = new Map<string, { expiresAt: number; value: KnowledgeAreasResponse }>();

class InvalidKnowledgeAreaRequestError extends Error {}

type Bucket = {
  key: string;
  doc_count: number;
};

type PathAggregations = {
  paths?: { buckets?: Bucket[] };
};

type AreaFilterAggregations = {
  areas?: { buckets?: Record<string, { doc_count: number }> };
};

function readSingle(value: string | string[] | undefined, name: string): string {
  if (value === undefined) return "";
  if (Array.isArray(value)) {
    throw new InvalidKnowledgeAreaRequestError(`Informe apenas um valor para ${name}.`);
  }
  const trimmed = value.trim();
  if (trimmed.length > MAX_FILTER_LENGTH) {
    throw new InvalidKnowledgeAreaRequestError(`Valor muito longo para ${name}.`);
  }
  return trimmed;
}

function readRequest(req: NextApiRequest) {
  const area = readSingle(req.query.area, "area");
  if (area.includes(PATH_SEPARATOR)) {
    throw new InvalidKnowledgeAreaRequestError("Informe apenas a grande area.");
  }
  const filters = Object.fromEntries(
    FILTER_KEYS.map((key) => [key, readSingle(req.query[key], key)]),
  ) as PublicationsDashboardFilters;
  if (filters.publicationDate && !/^\d{4}$/.test(filters.publicationDate)) {
    throw new InvalidKnowledgeAreaRequestError("O filtro publicationDate deve ser um ano com quatro digitos.");
  }
  return { parent: area || null, filters };
}

// Pesquisador entra se tiver ao menos uma publicação no ano/tipo e afiliação na instituição
function filterClauses(filters: PublicationsDashboardFilters) {
  const clauses: object[] = [];
  if (filters.publicationDate) {
    clauses.push({
      bool: {
        should: [
          { term: { "authorOf.year": filters.publicationDate } },
          { prefix: { "authorOf.publicationDate": filters.publicationDate } },
        ],
        minimum_should_match: 1,
      },
    });
  }
  if (filters.type) clauses.push({ term: { "authorOf.type": filters.type } });
  if (filters.institution) clauses.push({ term: { "affiliation.name": filters.institution } });
  return clauses;
}

function levelQuery(parent: string | null, filters: PublicationsDashboardFilters) {
  const level = parent
    ? { prefix: { researchArea: `${parent}${PATH_SEPARATOR}` } }
    : { exists: { field: "researchArea" } };
  return { bool: { filter: [level, ...filterClauses(filters)] } };
}

// Caminho exato ou qualquer descendente: a pessoa conta uma vez por área
function pathClause(path: string) {
  return {
    bool: {
      should: [
        { term: { researchArea: path } },
        { prefix: { researchArea: `${path}${PATH_SEPARATOR}` } },
      ],
      minimum_should_match: 1,
    },
  };
}

// Sem runtime field: lista os caminhos indexados e extrai os nomes do nível no Node
async function listCandidateNames(
  index: string,
  parent: string | null,
  filters: PublicationsDashboardFilters,
): Promise<string[]> {
  const response = await client.search(
    {
      index,
      size: 0,
      query: levelQuery(parent, filters),
      aggs: { paths: { terms: { field: "researchArea", size: PATH_TERMS_SIZE } } },
    },
    QUERY_OPTIONS,
  );

  const buckets = (response.aggregations as PathAggregations | undefined)?.paths?.buckets ?? [];
  const depth = parent ? 1 : 0;
  const weights = new Map<string, number>();
  for (const bucket of buckets) {
    const parts = bucket.key.split(PATH_SEPARATOR).map((part) => part.trim());
    if (parent && parts[0] !== parent) continue;
    const name = parts[depth];
    if (!name) continue;
    weights.set(name, (weights.get(name) ?? 0) + bucket.doc_count);
  }

  return [...weights.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_AREAS)
    .map(([name]) => name);
}

function groupSmallItems(buckets: Bucket[], total: number): KnowledgeAreaItem[] {
  const threshold = total * OTHER_THRESHOLD_SHARE;
  const main = buckets.filter((bucket) => bucket.doc_count >= threshold);
  const small = buckets.filter((bucket) => bucket.doc_count < threshold);
  const toItem = (bucket: Bucket): KnowledgeAreaItem => ({
    name: bucket.key,
    count: bucket.doc_count,
    isOther: false,
    groupedNames: [],
  });

  const items = main.map(toItem);
  if (small.length === 1) {
    items.push(toItem(small[0]));
  } else if (small.length > 1) {
    items.push({
      name: OTHER_KEY,
      count: small.reduce((sum, bucket) => sum + bucket.doc_count, 0),
      isOther: true,
      groupedNames: small.map((bucket) => bucket.key),
    });
  }
  return items;
}

async function fetchLevel(
  index: string,
  parent: string | null,
  filters: PublicationsDashboardFilters,
): Promise<KnowledgeAreasResponse> {
  const level = parent ? 2 : 1;
  const ignoredFilters = UNSUPPORTED_FILTERS.filter((key) => filters[key]);
  const names = await listCandidateNames(index, parent, filters);
  if (names.length === 0) {
    return { level, parent, totalWithArea: 0, ignoredFilters, items: [] };
  }

  const response = await client.search(
    {
      index,
      size: 0,
      track_total_hits: true,
      query: levelQuery(parent, filters),
      aggs: {
        areas: {
          filters: {
            filters: Object.fromEntries(
              names.map((name) => [
                name,
                pathClause(parent ? `${parent}${PATH_SEPARATOR}${name}` : name),
              ]),
            ),
          },
        },
      },
    },
    QUERY_OPTIONS,
  );

  const totalHits = response.hits.total;
  const totalWithArea = typeof totalHits === "number" ? totalHits : (totalHits?.value ?? 0);
  const aggs = response.aggregations as AreaFilterAggregations | undefined;
  const buckets = Object.entries(aggs?.areas?.buckets ?? {})
    .map(([key, value]) => ({ key, doc_count: value.doc_count }))
    .filter((bucket) => bucket.doc_count > 0)
    .sort((a, b) => b.doc_count - a.doc_count);

  return {
    level,
    parent,
    totalWithArea,
    ignoredFilters,
    items: groupSmallItems(buckets, totalWithArea),
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<KnowledgeAreasResponse | KnowledgeAreasErrorResponse>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Metodo nao permitido." });
  }

  const index = process.env.INDEX_PERSON;
  if (!index) {
    return res.status(500).json({ error: "Servico indisponivel." });
  }

  let request: ReturnType<typeof readRequest>;
  try {
    request = readRequest(req);
  } catch (error) {
    if (error instanceof InvalidKnowledgeAreaRequestError) {
      return res.status(400).json({ error: error.message });
    }
    throw error;
  }
  const { parent, filters } = request;

  const cacheKey = JSON.stringify([parent, filters]);
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return res.status(200).json(cached.value);
  }

  try {
    const value = await fetchLevel(index, parent, filters);
    if (cache.size >= CACHE_MAX_ENTRIES) cache.clear();
    cache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, value });
    return res.status(200).json(value);
  } catch (error) {
    logger.error("[knowledge-areas] falha na consulta");
    logger.error(error);
    return res.status(500).json({ error: "Falha ao carregar o painel." });
  }
}
