import type { NextApiRequest, NextApiResponse } from "next";
import { createElasticsearchClient } from "../../../services/ElasticsearchClient";
import logger from "../../../services/Logger";
import type {
  PatentsDashboardErrorResponse,
  PatentsSummaryResponse,
} from "../../../types/PatentsDashboard";

const client = createElasticsearchClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PatentsSummaryResponse | PatentsDashboardErrorResponse>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Metodo nao permitido." });
  }

  const index = process.env.INDEX_PATENT;

  if (!index) {
    logger.error("[dashboard/patents-summary] INDEX_PATENT is not configured");
    return res.status(500).json({ error: "Servico indisponivel." });
  }

  try {
    const response = await client.search({
      index,
      size: 0,
      track_total_hits: true,
    });

    const rawTotal = response.hits?.total;

    return res.status(200).json({
      summary: {
        total: typeof rawTotal === "number" ? rawTotal : rawTotal?.value ?? 0,
      },
    });
  } catch (error: unknown) {
    logger.error("[dashboard/patents-summary] falha ao carregar o painel");
    logger.error(error);
    return res.status(500).json({ error: "Falha ao carregar o painel." });
  }
}
