// Calcula a tabela fato "publicações por área do conhecimento" (dimensões = filtros do painel).
// Roda em worker thread disparada pela API: se faltar memória, só o worker cai, não o site.
import { readFileSync } from "node:fs";
import { mkdir, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { parentPort, workerData } from "node:worker_threads";
import { Client } from "es8";

const PATH_SEPARATOR = " / ";
const PAGE_SIZE = 1000;
const PAGE_RETRIES = 3;
const PATH_TERMS_SIZE = 5000;
const ID_CHUNK = 1000;
// V8 limita cada Set/Map a ~16,7 milhões de itens; dividir em fatias evita estourar
const SHARDS = 32;
const ALL = 0;
const MISSING = "";
const QUERY_OPTIONS = { requestTimeout: 120000, maxRetries: 3 };

const { personIndex, publicationIndex, sampleLimit, dimensions, outputPath, key } = workerData;
const singleDims = dimensions.filter((dim) => !dim.multi);
const multiDims = dimensions.filter((dim) => dim.multi);

const caPath = process.env.ELASTICSEARCH_CA_CERT_PATH?.trim();
const client = new Client({
  node: process.env.HOST_ELASTIC,
  auth: { apiKey: process.env.API_KEY || "" },
  tls: caPath ? { ca: readFileSync(resolve(process.cwd(), caPath)), rejectUnauthorized: true } : undefined,
});

function log(message) {
  parentPort?.postMessage({ type: "log", message });
}

// cyrb53: guardar números de 53 bits em vez dos IDs em texto reduz muito a memória
function hash53(value) {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < value.length; i++) {
    const ch = value.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

class ShardedSet {
  constructor() {
    this.shards = Array.from({ length: SHARDS }, () => new Set());
  }

  add(hash) {
    const set = this.shards[hash % SHARDS];
    if (set.has(hash)) return false;
    set.add(hash);
    return true;
  }

  get size() {
    return this.shards.reduce((sum, set) => sum + set.size, 0);
  }
}

class ShardedMap {
  constructor() {
    this.shards = Array.from({ length: SHARDS }, () => new Map());
  }

  get(hash) {
    return this.shards[hash % SHARDS].get(hash);
  }

  set(hash, value) {
    this.shards[hash % SHARDS].set(hash, value);
  }
}

class Dictionary {
  constructor() {
    this.values = ["*"];
    this.index = new Map([["*", ALL]]);
  }

  id(value) {
    let id = this.index.get(value);
    if (id === undefined) {
      id = this.values.length;
      this.values.push(value);
      this.index.set(value, id);
    }
    return id;
  }
}

const dimDictionaries = new Map(dimensions.map((dim) => [dim.key, new Dictionary()]));
// Combinação dos filtros de valor único (ex.: ano|tipo|idioma) -> número
const cellDictionary = new Dictionary();
const cellByPub = new ShardedMap();
const multiByPub = new ShardedMap();
const facts = new Map();

function splitPath(path) {
  return String(path)
    .split(PATH_SEPARATOR)
    .map((part) => part.trim());
}

function areaClause(path) {
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

// Timeout não é repetido pelo cliente por padrão; com search_after repetir a página é seguro
async function withRetry(run) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await run();
    } catch (error) {
      if (attempt >= PAGE_RETRIES) throw error;
      log(`pagina falhou (tentativa ${attempt}): ${error?.message ?? error}; tentando de novo`);
      await new Promise((resolveDelay) => setTimeout(resolveDelay, 5000 * attempt));
    }
  }
}

async function* scanDocs(index, query, fields) {
  const pit = await withRetry(() =>
    client.openPointInTime({ index, keep_alive: "10m" }, QUERY_OPTIONS),
  );
  let pitId = pit.id;
  let searchAfter;
  try {
    while (true) {
      const response = await withRetry(() =>
        client.search(
          {
            size: PAGE_SIZE,
            query,
            _source: false,
            docvalue_fields: fields,
            pit: { id: pitId, keep_alive: "10m" },
            sort: ["_shard_doc"],
            ...(searchAfter ? { search_after: searchAfter } : {}),
          },
          QUERY_OPTIONS,
        ),
      );
      if (response.pit_id) pitId = response.pit_id;
      const hits = response.hits.hits;
      if (hits.length === 0) break;
      for (const hit of hits) yield hit;
      searchAfter = hits[hits.length - 1].sort;
    }
  } finally {
    await client.closePointInTime({ id: pitId }).catch(() => undefined);
  }
}

async function* scanArea(major) {
  let people = 0;
  for await (const hit of scanDocs(personIndex, areaClause(major), ["researchArea", "authorOf.id"])) {
    if (sampleLimit && people >= sampleLimit) return;
    people += 1;
    yield hit.fields ?? {};
  }
}

async function listMajorAreas() {
  const response = await withRetry(() =>
    client.search(
      {
        index: personIndex,
        size: 0,
        query: { exists: { field: "researchArea" } },
        aggs: { paths: { terms: { field: "researchArea", size: PATH_TERMS_SIZE } } },
      },
      QUERY_OPTIONS,
    ),
  );
  const names = new Set();
  for (const bucket of response.aggregations?.paths?.buckets ?? []) {
    const root = splitPath(bucket.key)[0];
    if (root) names.add(root);
  }
  return [...names];
}

// Dimensões com limite (ex.: instituição) guardam só os valores mais frequentes
async function loadAllowedValues() {
  const allowed = new Map();
  for (const dim of dimensions) {
    if (!dim.limit) continue;
    const response = await withRetry(() =>
      client.search(
        {
          index: publicationIndex,
          size: 0,
          aggs: { top: { terms: { field: dim.field, size: dim.limit } } },
        },
        QUERY_OPTIONS,
      ),
    );
    allowed.set(
      dim.key,
      new Set((response.aggregations?.top?.buckets ?? []).map((bucket) => String(bucket.key))),
    );
  }
  return allowed;
}

function registerPublication(hit, allowed) {
  const fields = hit.fields ?? {};
  const cellParts = singleDims.map((dim) =>
    dimDictionaries.get(dim.key).id(String(fields[dim.field]?.[0] ?? MISSING)),
  );
  const cell = cellDictionary.id(cellParts.join("|"));
  const multi = multiDims.map((dim) => {
    const permitted = allowed.get(dim.key);
    return [...new Set((fields[dim.field] ?? []).map(String))]
      .filter((value) => !permitted || permitted.has(value))
      .map((value) => dimDictionaries.get(dim.key).id(value));
  });
  const hasMulti = multi.some((values) => values.length > 0);
  // authorOf.id pode corresponder ao _id ou ao campo id da publicação
  for (const id of new Set([fields.id?.[0], hit._id].filter(Boolean).map(String))) {
    const hash = hash53(id);
    cellByPub.set(hash, cell);
    if (hasMulti) multiByPub.set(hash, multi);
  }
}

function publicationFields() {
  return ["id", ...new Set(dimensions.map((dim) => dim.field))];
}

async function loadAllPublications(allowed) {
  let count = 0;
  for await (const hit of scanDocs(publicationIndex, { match_all: {} }, publicationFields())) {
    registerPublication(hit, allowed);
    count += 1;
    if (count % 1000000 === 0) log(`publicacoes lidas: ${count}`);
  }
  log(`publicacoes lidas: ${count}`);
}

async function loadPublicationsById(ids, allowed) {
  const list = [...ids];
  let found = 0;
  for (let i = 0; i < list.length; i += ID_CHUNK) {
    const chunk = list.slice(i, i + ID_CHUNK);
    // Só _id: busca direta e rápida; "terms" no campo id varre o índice inteiro
    const response = await withRetry(() =>
      client.search(
        {
          index: publicationIndex,
          size: chunk.length,
          _source: false,
          docvalue_fields: publicationFields(),
          query: { ids: { values: chunk } },
        },
        QUERY_OPTIONS,
      ),
    );
    for (const hit of response.hits.hits) registerPublication(hit, allowed);
    found += response.hits.hits.length;
    if ((i / ID_CHUNK) % 5 === 4) log(`publicacoes buscadas: ${i + chunk.length} de ${list.length}`);
  }
  log(`publicacoes da amostra: ${found} encontradas de ${list.length}`);
}

async function collectSampleIds(majors) {
  const ids = new Set();
  for (const major of majors) {
    for await (const fields of scanArea(major)) {
      for (const id of fields["authorOf.id"] ?? []) ids.add(String(id));
    }
  }
  return ids;
}

let unknownCell = null;
function cellOf(pub) {
  const cell = cellByPub.get(pub);
  if (cell !== undefined) return cell;
  unknownCell ??= cellDictionary.id(
    singleDims.map((dim) => dimDictionaries.get(dim.key).id(MISSING)).join("|"),
  );
  return unknownCell;
}

// Multivaloradas: a linha "*" e uma por valor, para nunca somar a mesma publicação duas vezes
function multiVariants(pub) {
  const multi = multiByPub.get(pub);
  let variants = [[]];
  multiDims.forEach((_, i) => {
    const options = [ALL, ...(multi?.[i] ?? [])];
    variants = variants.flatMap((prefix) => options.map((option) => [...prefix, option]));
  });
  return variants;
}

function addFact(g, a, pub) {
  const cell = cellOf(pub);
  for (const variant of multiVariants(pub)) {
    const factKey = [g, a, cell, ...variant].join("|");
    facts.set(factKey, (facts.get(factKey) ?? 0) + 1);
  }
}

async function countPeople(majors) {
  const grandeAreas = new Dictionary();
  const areas = new Dictionary();
  const total = new ShardedSet();

  for (const major of majors) {
    const g = grandeAreas.id(major);
    const majorSet = new ShardedSet();
    const childSets = new Map();
    let people = 0;

    for await (const fields of scanArea(major)) {
      people += 1;
      const pubs = (fields["authorOf.id"] ?? []).map((id) => hash53(String(id)));
      if (pubs.length === 0) continue;

      const children = new Set();
      for (const path of fields.researchArea ?? []) {
        const parts = splitPath(path);
        if (parts[0] === major && parts[1]) children.add(parts[1]);
      }

      for (const pub of pubs) {
        if (total.add(pub)) addFact(ALL, ALL, pub);
        if (majorSet.add(pub)) addFact(g, ALL, pub);
        for (const child of children) {
          let set = childSets.get(child);
          if (!set) {
            set = new ShardedSet();
            childSets.set(child, set);
          }
          if (set.add(pub)) addFact(g, areas.id(child), pub);
        }
      }
    }
    log(`${major}: ${people} pesquisadores, ${majorSet.size} publicacoes`);
  }
  return { grandeAreas, areas };
}

async function main() {
  const startedAt = Date.now();
  const majors = await listMajorAreas();
  log(`grandes areas: ${majors.join(", ")}`);
  log("buscando instituicoes mais frequentes");
  const allowed = await loadAllowedValues();

  if (sampleLimit) {
    log("coletando ids de publicacoes da amostra");
    const ids = await collectSampleIds(majors);
    log(`buscando atributos de ${ids.size} publicacoes`);
    await loadPublicationsById(ids, allowed);
  } else {
    await loadAllPublications(allowed);
  }

  const { grandeAreas, areas } = await countPeople(majors);

  const cells = cellDictionary.values.map((cell) => (cell === "*" ? [] : cell.split("|").map(Number)));
  const rows = [];
  for (const [factKey, count] of facts) {
    const [g, a, cell, ...variant] = factKey.split("|").map(Number);
    let single = 0;
    let multi = 0;
    const dims = dimensions.map((dim) => (dim.multi ? variant[multi++] : cells[cell][single++]));
    rows.push([g, a, ...dims, count]);
  }

  const snapshot = {
    key,
    generatedAt: new Date().toISOString(),
    dimensions: ["grandeArea", "area", ...dimensions.map((dim) => dim.key)],
    dictionaries: {
      grandeArea: grandeAreas.values,
      area: areas.values,
      ...Object.fromEntries(dimensions.map((dim) => [dim.key, dimDictionaries.get(dim.key).values])),
    },
    rows,
  };

  await mkdir(dirname(outputPath), { recursive: true });
  const tempPath = `${outputPath}.tmp`;
  await writeFile(tempPath, JSON.stringify(snapshot));
  await rename(tempPath, outputPath);
  log(`tabela fato: ${rows.length} linhas; calculo concluido em ${Math.round((Date.now() - startedAt) / 1000)}s`);
}

main()
  .then(async () => {
    await client.close();
    process.exit(0);
  })
  .catch(async (error) => {
    parentPort?.postMessage({ type: "error", message: String(error?.stack ?? error) });
    await client.close().catch(() => undefined);
    process.exit(1);
  });
