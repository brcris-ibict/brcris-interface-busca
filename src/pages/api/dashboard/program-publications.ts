import type { NextApiRequest, NextApiResponse } from "next";
import { createElasticsearchClient } from "../../../services/ElasticsearchClient";
import logger from "../../../services/Logger";
import { fetchAllPrograms } from "../../../lib/programDocuments";
import type {
  ProgramPublicationsResponse,
  ProgramPublicationsRow,
  ProgramsDashboardErrorResponse,
} from "../../../types/ProgramsDashboard";

const client = createElasticsearchClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ProgramPublicationsResponse | ProgramsDashboardErrorResponse>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Metodo nao permitido." });
  }

  const index = process.env.INDEX_PROGRAM;

  if (!index) {
    logger.error("[dashboard/program-publications] INDEX_PROGRAM is not configured");
    return res.status(500).json({ error: "Servico indisponivel." });
  }

  try {
    // `name` é text no índice (sem agregação); agrupa programa + instituição aqui,
    // unindo os ids para contar publicações distintas como o cardinality do Kibana
    const groups = new Map<string, { program: string; institution: string; ids: Set<string> }>();

    (await fetchAllPrograms(client, index)).forEach((doc) => {
      if (!doc.name) return;
      doc.institutions.forEach((institution) => {
        const key = `${doc.name}\u0000${institution}`;
        const group = groups.get(key) ?? { program: doc.name, institution, ids: new Set<string>() };
        doc.publicationIds.forEach((id) => group.ids.add(id));
        groups.set(key, group);
      });
    });

    const collator = new Intl.Collator("pt-BR", { sensitivity: "base" });
    const items: ProgramPublicationsRow[] = [...groups.values()]
      .map((group) => ({ program: group.program, institution: group.institution, publications: group.ids.size }))
      .sort(
        (a, b) =>
          b.publications - a.publications ||
          collator.compare(a.program, b.program) ||
          collator.compare(a.institution, b.institution),
      )
      .map((row, position) => ({ rank: position + 1, ...row }));

    return res.status(200).json({ items });
  } catch (error: unknown) {
    logger.error("[dashboard/program-publications] falha ao carregar o painel");
    logger.error(error);
    return res.status(500).json({ error: "Falha ao carregar o painel." });
  }
}
