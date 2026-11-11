import type { NextApiRequest, NextApiResponse } from "next";
import { createElasticsearchClient } from "../../../services/ElasticsearchClient";
import logger from "../../../services/Logger";
import type {
  ProgramsDashboardErrorResponse,
  ProgramsSummaryResponse,
} from "../../../types/ProgramsDashboard";

const client = createElasticsearchClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ProgramsSummaryResponse | ProgramsDashboardErrorResponse>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Metodo nao permitido." });
  }

  const index = process.env.INDEX_PROGRAM;

  if (!index) {
    logger.error("[dashboard/programs-summary] INDEX_PROGRAM is not configured");
    return res.status(500).json({ error: "Servico indisponivel." });
  }

  try {
    const response = await client.search({
      index,
      size: 0,
      track_total_hits: true,
      aggs: {
        with_doctorate: {
          filter: { terms: { "course.degree": ["Doutorado", "Doutorado Profissional"] } },
        },
        // Programas em rede/associação: mais de uma instituição no mesmo programa
        networked: {
          filter: { script: { script: "doc['orgUnit.name'].size() > 1" } },
        },
      },
    });

    const aggregations = response.aggregations as
      | Record<"with_doctorate" | "networked", { doc_count?: number }>
      | undefined;
    const rawTotal = response.hits?.total;

    return res.status(200).json({
      summary: {
        total: typeof rawTotal === "number" ? rawTotal : rawTotal?.value ?? 0,
        withDoctorate: aggregations?.with_doctorate?.doc_count ?? 0,
        networked: aggregations?.networked?.doc_count ?? 0,
      },
    });
  } catch (error: unknown) {
    logger.error("[dashboard/programs-summary] falha ao carregar o painel");
    logger.error(error);
    return res.status(500).json({ error: "Falha ao carregar o painel." });
  }
}
