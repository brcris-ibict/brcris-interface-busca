import type { NextApiRequest, NextApiResponse } from "next";
import { createElasticsearchClient } from "../../../services/ElasticsearchClient";
import logger from "../../../services/Logger";
import { fetchAllPrograms } from "../../../lib/programDocuments";
import type {
  ProgramListResponse,
  ProgramsDashboardErrorResponse,
} from "../../../types/ProgramsDashboard";

const client = createElasticsearchClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ProgramListResponse | ProgramsDashboardErrorResponse>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Metodo nao permitido." });
  }

  const index = process.env.INDEX_PROGRAM;

  if (!index) {
    logger.error("[dashboard/program-list] INDEX_PROGRAM is not configured");
    return res.status(500).json({ error: "Servico indisponivel." });
  }

  try {
    const collator = new Intl.Collator("pt-BR", { sensitivity: "base" });
    const items = (await fetchAllPrograms(client, index))
      .filter((doc) => doc.id && doc.name)
      .flatMap((doc) =>
        (doc.institutions.length > 0 ? doc.institutions : [""]).map((institution) => ({
          id: doc.id,
          name: doc.name,
          institution,
        })),
      )
      .sort((a, b) => collator.compare(a.name, b.name) || collator.compare(a.institution, b.institution))
      .map((row, position) => ({ rank: position + 1, ...row }));

    return res.status(200).json({ items });
  } catch (error: unknown) {
    logger.error("[dashboard/program-list] falha ao carregar o painel");
    logger.error(error);
    return res.status(500).json({ error: "Falha ao carregar o painel." });
  }
}
