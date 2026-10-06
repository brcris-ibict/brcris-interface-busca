import "server-only";

import { readFile } from "fs/promises";
import { resolve } from "path";
import { Worker } from "worker_threads";
import logger from "./Logger";
import type { PublicationsDashboardFilters } from "../types/PublicationsDashboard";

export type FilterKey = keyof PublicationsDashboardFilters;

export type KnowledgeAreasSnapshot = {
  key: string;
  generatedAt: string;
  // ["grandeArea", "area", ...filtros]; cada linha = [...índices nos dicionários, publicacoes]
  dimensions: string[];
  // Índice 0 de todo dicionário é "*" (todos)
  dictionaries: Record<string, string[]>;
  rows: number[][];
};

export type KnowledgeAreasSnapshotState =
  | { status: "ready"; snapshot: KnowledgeAreasSnapshot }
  // Cálculo novo em andamento; snapshot é a versão anterior compatível
  | { status: "updating"; snapshot: KnowledgeAreasSnapshot }
  | { status: "building" }
  | { status: "failed" };

type DimensionConfig = {
  key: FilterKey;
  field: string;
  // Uma publicação pode ter vários valores: a tabela guarda também a linha "*"
  multi: boolean;
  // Só os valores mais frequentes viram linhas (controla o tamanho da tabela)
  limit?: number;
};

// Para incluir um filtro: adicionar aqui com o campo do índice de publicações
export const FACT_DIMENSIONS: DimensionConfig[] = [
  { key: "publicationDate", field: "publicationDate", multi: false },
  { key: "type", field: "type", multi: false },
  { key: "language", field: "language", multi: false },
  { key: "institution", field: "sponsorOrgUnit.name", multi: true, limit: 100 },
];

// Amostra para testar rápido em dev (pesquisadores por grande área); 0 = cálculo completo. Produção sempre completo
const DEV_SAMPLE_LIMIT = 0;
const SAMPLE_LIMIT = process.env.NODE_ENV === "production" ? 0 : DEV_SAMPLE_LIMIT;
// Mudar a versão força recálculo quando o formato da tabela mudar
const FACT_VERSION = 1;
const WORKER_MEMORY_MB = 4096;
const RETRY_AFTER_FAILURE_MS = 10 * 60 * 1000;
// Snapshot mais antigo que isso é recalculado em background (a versão salva segue exibida)
const MAX_AGE_MS = 24 * 60 * 60 * 1000;
// Fora da pasta do repositório: o checkout do deploy (git clean) não apaga o arquivo
const DATA_PATH = resolve(process.cwd(), "../brcris-data/knowledge-areas-publications.json");
const WORKER_PATH = resolve(process.cwd(), "scripts/knowledge-areas-worker.mjs");

type BuildState = {
  running: boolean;
  failedAt: number | null;
  memory: KnowledgeAreasSnapshot | null;
};

// globalThis: o estado sobrevive ao hot reload do Next em dev e evita cálculos duplicados
const globalStore = globalThis as typeof globalThis & { __knowledgeAreasFacts?: BuildState };
const state: BuildState = (globalStore.__knowledgeAreasFacts ??= {
  running: false,
  failedAt: null,
  memory: null,
});

// Parte da marca que define o formato da tabela: versão, filtros e modo (amostra ou completo)
function compatibilityKey() {
  const dimensions = FACT_DIMENSIONS.map((dim) => `${dim.key}:${dim.field}:${dim.limit ?? ""}`).join(",");
  const mode = SAMPLE_LIMIT ? `amostra-${SAMPLE_LIMIT}` : "completo";
  return [`v${FACT_VERSION}`, dimensions, mode].join("|");
}

// Índices, filtros ou amostra diferentes geram outra marca e disparam recálculo
function snapshotKey(personIndex: string, publicationIndex: string) {
  return [personIndex, publicationIndex, compatibilityKey()].join("|");
}

// Só versões com o mesmo formato e modo podem ser exibidas enquanto a nova é calculada
function isCompatible(snapshot: KnowledgeAreasSnapshot | null): snapshot is KnowledgeAreasSnapshot {
  return Boolean(snapshot && Array.isArray(snapshot.rows) && snapshot.key?.endsWith(`|${compatibilityKey()}`));
}

function isStale(snapshot: KnowledgeAreasSnapshot): boolean {
  const generatedAt = Date.parse(snapshot.generatedAt);
  return !Number.isFinite(generatedAt) || Date.now() - generatedAt > MAX_AGE_MS;
}

async function readStored(): Promise<KnowledgeAreasSnapshot | null> {
  try {
    return JSON.parse(await readFile(DATA_PATH, "utf-8")) as KnowledgeAreasSnapshot;
  } catch {
    return null;
  }
}

function startBuild(personIndex: string, publicationIndex: string, key: string) {
  logger.info(`[knowledge-areas] iniciando calculo (${key})`);
  state.running = true;
  const worker = new Worker(WORKER_PATH, {
    workerData: {
      personIndex,
      publicationIndex,
      sampleLimit: SAMPLE_LIMIT,
      dimensions: FACT_DIMENSIONS,
      outputPath: DATA_PATH,
      key,
    },
    resourceLimits: { maxOldGenerationSizeMb: WORKER_MEMORY_MB },
  });
  worker.on("message", (message: { type: string; message: string }) => {
    if (message.type === "error") logger.error(`[knowledge-areas] ${message.message}`);
    else logger.info(`[knowledge-areas] ${message.message}`);
  });
  worker.on("error", (error) => {
    logger.error("[knowledge-areas] falha no calculo");
    logger.error(error);
  });
  worker.on("exit", (code) => {
    state.running = false;
    if (code === 0) {
      state.failedAt = null;
    } else {
      state.failedAt = Date.now();
      logger.error(`[knowledge-areas] calculo encerrado com codigo ${code}`);
    }
  });
}

export async function getKnowledgeAreasSnapshot(
  personIndex: string,
  publicationIndex: string,
): Promise<KnowledgeAreasSnapshotState> {
  const key = snapshotKey(personIndex, publicationIndex);
  if (state.memory?.key === key && !isStale(state.memory)) {
    return { status: "ready", snapshot: state.memory };
  }

  if (!state.running) {
    const stored = await readStored();
    if (stored?.key === key) {
      state.memory = stored;
      if (!isStale(stored)) return { status: "ready", snapshot: stored };
    }
    if (isCompatible(stored)) state.memory = stored;
  }

  const previous = isCompatible(state.memory) ? state.memory : null;
  if (state.running) return previous ? { status: "updating", snapshot: previous } : { status: "building" };
  if (state.failedAt && Date.now() - state.failedAt < RETRY_AFTER_FAILURE_MS) {
    // Cálculo novo falhou: a versão anterior continua válida
    return previous ? { status: "ready", snapshot: previous } : { status: "failed" };
  }

  startBuild(personIndex, publicationIndex, key);
  return previous ? { status: "updating", snapshot: previous } : { status: "building" };
}
