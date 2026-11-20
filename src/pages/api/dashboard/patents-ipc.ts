import type { NextApiRequest, NextApiResponse } from "next";
import { createElasticsearchClient } from "../../../services/ElasticsearchClient";
import logger from "../../../services/Logger";
import type {
  PatentIpcResponse,
  PatentsDashboardErrorResponse,
} from "../../../types/PatentsDashboard";

const client = createElasticsearchClient();

// Cobre os 28.700 códigos atuais e deixa folga. size 500000 não traz código a mais.
const IPC_TERMS_SIZE = 40000;

type IpcAggregations = {
  with_ipc?: { doc_count?: number };
  codes?: {
    sum_other_doc_count?: number;
    buckets?: { key: string; doc_count: number }[];
  };
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PatentIpcResponse | PatentsDashboardErrorResponse>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Metodo nao permitido." });
  }

  const index = process.env.INDEX_PATENT;

  if (!index) {
    logger.error("[dashboard/patents-ipc] INDEX_PATENT is not configured");
    return res.status(500).json({ error: "Servico indisponivel." });
  }

  try {
    const response = await client.search({
      index,
      size: 0,
      track_total_hits: true,
      aggs: {
        with_ipc: { filter: { exists: { field: "IPCclassification" } } },
        codes: {
          terms: {
            field: "IPCclassification",
            size: IPC_TERMS_SIZE,
            order: { _count: "desc" },
          },
        },
      },
    });

    const aggregations = response.aggregations as IpcAggregations | undefined;
    const rawTotal = response.hits?.total;
    const hidden = aggregations?.codes?.sum_other_doc_count ?? 0;

    if (hidden > 0) {
      logger.error(
        `[dashboard/patents-ipc] ${hidden} atribuicoes ficaram de fora do terms; aumente IPC_TERMS_SIZE`,
      );
    }

    return res.status(200).json({
      items: (aggregations?.codes?.buckets ?? []).map((bucket, position) => ({
        rank: position + 1,
        code: bucket.key,
        count: bucket.doc_count,
      })),
      withIpc: aggregations?.with_ipc?.doc_count ?? 0,
      total: typeof rawTotal === "number" ? rawTotal : rawTotal?.value ?? 0,
    });
  } catch (error: unknown) {
    logger.error("[dashboard/patents-ipc] falha ao carregar o painel");
    logger.error(error);
    return res.status(500).json({ error: "Falha ao carregar o painel." });
  }
}
