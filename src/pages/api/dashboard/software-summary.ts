import type { NextApiRequest, NextApiResponse } from "next";
import { createElasticsearchClient } from "../../../services/ElasticsearchClient";
import logger from "../../../services/Logger";
import type {
  SoftwareDashboardErrorResponse,
  SoftwareSummaryResponse,
} from "../../../types/SoftwareDashboard";

const client = createElasticsearchClient();

// Valores de fundingInstitution que indicam ausência de fomento externo.
const NO_FUNDING_VALUES = ["Nenhuma", "Financiamento Próprio"];

// depositDate/concessionDate são keyword no formato DDMMAAAA; em parte dos registros
// o zero à esquerda do dia foi perdido (ex.: "1072019" = 01/07/2019). Campos multivalorados
// usam a data mais antiga.
const CONCESSION_DAYS_SCRIPT = `
long toEpochDay(String raw) {
  String s = raw.length() == 7 ? '0' + raw : raw;
  if (s.length() != 8) { return Long.MIN_VALUE; }
  try {
    return LocalDate.of(Integer.parseInt(s.substring(4, 8)), Integer.parseInt(s.substring(2, 4)), Integer.parseInt(s.substring(0, 2))).toEpochDay();
  } catch (Exception e) {
    return Long.MIN_VALUE;
  }
}
long earliest(def values) {
  long best = Long.MAX_VALUE;
  for (String v : values) {
    long day = toEpochDay(v);
    if (day != Long.MIN_VALUE && day < best) { best = day; }
  }
  return best;
}
long dep = earliest(doc['depositDate']);
long con = earliest(doc['concessionDate']);
if (dep != Long.MAX_VALUE && con != Long.MAX_VALUE && con >= dep) { emit(con - dep); }
`;

type SummaryAggregations = {
  granted?: { doc_count?: number };
  creators?: { value?: number };
  with_creator?: { doc_count?: number; per_software?: { value?: number | null } };
  with_funding?: { doc_count?: number; funders?: { value?: number } };
};

type ConcessionAggregations = {
  concession_days?: { values?: Record<string, number | null> };
};

async function fetchMedianConcessionDays(index: string): Promise<number | null> {
  try {
    const response = await client.search({
      index,
      size: 0,
      query: {
        bool: {
          filter: [
            { exists: { field: "depositDate" } },
            { exists: { field: "concessionDate" } },
          ],
        },
      },
      runtime_mappings: {
        concession_days: {
          type: "long",
          script: { source: CONCESSION_DAYS_SCRIPT },
        },
      },
      aggs: {
        concession_days: { percentiles: { field: "concession_days", percents: [50] } },
      },
    });

    const aggregations = response.aggregations as ConcessionAggregations | undefined;
    const median = aggregations?.concession_days?.values?.["50.0"];
    return typeof median === "number" ? Math.round(median) : null;
  } catch (error: unknown) {
    logger.error("[dashboard/software-summary] falha ao calcular o tempo de concessao");
    logger.error(error);
    return null;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SoftwareSummaryResponse | SoftwareDashboardErrorResponse>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Metodo nao permitido." });
  }

  const index = process.env.INDEX_SOFTWARE;

  if (!index) {
    logger.error("[dashboard/software-summary] INDEX_SOFTWARE is not configured");
    return res.status(500).json({ error: "Servico indisponivel." });
  }

  try {
    const [response, medianConcessionDays] = await Promise.all([
      client.search({
        index,
        size: 0,
        track_total_hits: true,
        aggs: {
          granted: { filter: { exists: { field: "concessionDate" } } },
          creators: {
            cardinality: { field: "creator.id", precision_threshold: 40000 },
          },
          with_creator: {
            filter: { exists: { field: "creator.id" } },
            aggs: {
              per_software: { avg: { script: { source: "doc['creator.id'].size()" } } },
            },
          },
          with_funding: {
            filter: {
              bool: {
                filter: [{ exists: { field: "fundingInstitution" } }],
                must_not: [{ terms: { fundingInstitution: NO_FUNDING_VALUES } }],
              },
            },
            aggs: {
              funders: {
                cardinality: { field: "fundingInstitution", precision_threshold: 40000 },
              },
            },
          },
        },
      }),
      fetchMedianConcessionDays(index),
    ]);

    const aggregations = response.aggregations as SummaryAggregations | undefined;
    const rawTotal = response.hits?.total;
    const avgCreators = aggregations?.with_creator?.per_software?.value;

    return res.status(200).json({
      summary: {
        total: typeof rawTotal === "number" ? rawTotal : rawTotal?.value ?? 0,
        granted: aggregations?.granted?.doc_count ?? 0,
        medianConcessionDays,
        creators: aggregations?.creators?.value ?? 0,
        avgCreatorsPerSoftware: typeof avgCreators === "number" ? avgCreators : null,
        funders: aggregations?.with_funding?.funders?.value ?? 0,
        withFunding: aggregations?.with_funding?.doc_count ?? 0,
      },
    });
  } catch (error: unknown) {
    logger.error("[dashboard/software-summary] falha ao carregar o painel");
    logger.error(error);
    return res.status(500).json({ error: "Falha ao carregar o painel." });
  }
}
