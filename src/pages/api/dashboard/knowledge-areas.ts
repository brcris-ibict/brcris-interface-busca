import type { NextApiRequest, NextApiResponse } from "next";
import logger from "../../../services/Logger";
import {
  FACT_DIMENSIONS,
  getKnowledgeAreasSnapshot,
  type FilterKey,
  type KnowledgeAreasSnapshot,
} from "../../../services/knowledgeAreasSnapshot";
import type {
  KnowledgeAreaItem,
  KnowledgeAreasErrorResponse,
  KnowledgeAreasResponse,
} from "../../../types/KnowledgeAreas";
import type { PublicationsDashboardFilters } from "../../../types/PublicationsDashboard";

const PATH_SEPARATOR = " / ";
const MAX_FILTER_LENGTH = 200;
const OTHER_THRESHOLD_SHARE = 0.015;
const OTHER_KEY = "__other__";
const ALL = 0;
const FILTER_KEYS: FilterKey[] = ["publicationDate", "type", "language", "institution"];
const RESULT_CACHE_SIZE = 500;

class InvalidKnowledgeAreaRequestError extends Error {}

type Bucket = {
  key: string;
  doc_count: number;
};

type LevelResult = {
  totalWithArea: number;
  buckets: Bucket[];
  unsupportedFilter: FilterKey | null;
};

type SnapshotIndexes = {
  lookups: Map<string, Map<string, number>>;
  results: Map<string, LevelResult>;
};

// Por snapshot: dicionários como Map (busca direta) e cache das somas já feitas
const snapshotIndexes = new WeakMap<KnowledgeAreasSnapshot, SnapshotIndexes>();

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

function getIndexes(snapshot: KnowledgeAreasSnapshot): SnapshotIndexes {
  let indexes = snapshotIndexes.get(snapshot);
  if (!indexes) {
    const lookups = new Map(
      Object.entries(snapshot.dictionaries).map(([name, values]) => [
        name,
        new Map(values.map((value, index) => [value, index])),
      ]),
    );
    indexes = { lookups, results: new Map() };
    snapshotIndexes.set(snapshot, indexes);
  }
  return indexes;
}

function remember(results: Map<string, LevelResult>, key: string, value: LevelResult) {
  if (results.size >= RESULT_CACHE_SIZE) results.clear();
  results.set(key, value);
  return value;
}

function sumLevel(
  snapshot: KnowledgeAreasSnapshot,
  parent: string | null,
  filters: PublicationsDashboardFilters,
): LevelResult {
  const { lookups, results } = getIndexes(snapshot);
  const cacheKey = JSON.stringify([parent, filters]);
  const cached = results.get(cacheKey);
  if (cached) return cached;

  const empty = (unsupportedFilter: FilterKey | null = null) =>
    remember(results, cacheKey, { totalWithArea: 0, buckets: [], unsupportedFilter });

  // Multivaloradas sem filtro usam a linha "*" para não contar a mesma publicação várias vezes
  const required: { column: number; value: number }[] = [];
  for (let column = 2; column < snapshot.dimensions.length; column++) {
    const key = snapshot.dimensions[column] as FilterKey;
    const config = FACT_DIMENSIONS.find((dim) => dim.key === key);
    const filterValue = filters[key];
    if (filterValue) {
      const value = lookups.get(key)?.get(filterValue);
      if (value === undefined) return empty(config?.limit ? key : null);
      required.push({ column, value });
    } else if (config?.multi) {
      required.push({ column, value: ALL });
    }
  }

  const parentIndex = parent ? lookups.get("grandeArea")?.get(parent) : ALL;
  if (parentIndex === undefined) return empty();

  const names = parent ? snapshot.dictionaries.area : snapshot.dictionaries.grandeArea;
  const countColumn = snapshot.dimensions.length;
  const sums = new Map<number, number>();
  let totalWithArea = 0;

  for (const row of snapshot.rows) {
    if (!required.every(({ column, value }) => row[column] === value)) continue;
    const [g, a] = row;
    const count = row[countColumn];
    if (parent) {
      if (g !== parentIndex) continue;
      if (a === ALL) totalWithArea += count;
      else sums.set(a, (sums.get(a) ?? 0) + count);
    } else {
      if (a !== ALL) continue;
      if (g === ALL) totalWithArea += count;
      else sums.set(g, (sums.get(g) ?? 0) + count);
    }
  }

  const buckets = [...sums]
    .map(([index, count]) => ({ key: names[index], doc_count: count }))
    .filter((bucket) => bucket.doc_count > 0)
    .sort((a, b) => b.doc_count - a.doc_count);

  return remember(results, cacheKey, { totalWithArea, buckets, unsupportedFilter: null });
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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<KnowledgeAreasResponse | KnowledgeAreasErrorResponse>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Metodo nao permitido." });
  }

  const personIndex = process.env.INDEX_PERSON;
  const publicationIndex = process.env.INDEX_PUBLICATION;
  if (!personIndex || !publicationIndex) {
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
  const level = parent ? 2 : 1;

  try {
    const result = await getKnowledgeAreasSnapshot(personIndex, publicationIndex);
    if (result.status === "building") {
      return res.status(202).json({
        status: "building",
        level,
        parent,
        totalWithArea: 0,
        generatedAt: null,
        unsupportedFilter: null,
        items: [],
      });
    }
    if (result.status === "failed") {
      return res.status(503).json({ error: "Falha ao preparar os dados do painel." });
    }

    const sum = sumLevel(result.snapshot, parent, filters);
    return res.status(200).json({
      status: result.status,
      level,
      parent,
      totalWithArea: sum.totalWithArea,
      generatedAt: result.snapshot.generatedAt,
      unsupportedFilter: sum.unsupportedFilter,
      items: groupSmallItems(sum.buckets, sum.totalWithArea),
    });
  } catch (error) {
    logger.error("[knowledge-areas] falha na consulta");
    logger.error(error);
    return res.status(500).json({ error: "Falha ao carregar o painel." });
  }
}
