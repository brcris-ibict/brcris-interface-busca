import type { NextApiRequest, NextApiResponse } from "next";
import { createElasticsearchClient } from "../../../services/ElasticsearchClient";
import logger from "../../../services/Logger";
import type {
  ThesesDashboardErrorResponse,
  ThesisInstitutionPoint,
  ThesisInstitutionsResponse,
} from "../../../types/ThesesDashboard";

const client = createElasticsearchClient();

const THESIS_TYPES = ["Tese", "Dissertação"] as const;
const TOP_SIZE = 500;

type TypeBucket = { key?: string | number; doc_count?: number };
type InstitutionBucket = {
  key?: string | number;
  key_as_string?: string;
  doc_count?: number;
  by_type?: { buckets?: TypeBucket[] };
};
type Aggregations = {
  with_institution?: { doc_count?: number };
  by_institution?: { buckets?: InstitutionBucket[] };
};

function bucketCount(buckets: TypeBucket[] | undefined, key: string) {
  return buckets?.find((bucket) => String(bucket.key) === key)?.doc_count ?? 0;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ThesisInstitutionsResponse | ThesesDashboardErrorResponse>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Metodo nao permitido." });
  }

  const index = process.env.INDEX_PUBLICATION;

  if (!index) {
    logger.error("[dashboard/theses-institutions] INDEX_PUBLICATION is not configured");
    return res.status(500).json({ error: "Servico indisponivel." });
  }

  try {
    const response = await client.search({
      index,
      size: 0,
      track_total_hits: true,
      query: {
        terms: { type: [...THESIS_TYPES] },
      },
      aggs: {
        with_institution: {
          filter: { exists: { field: "sponsorOrgUnit.name" } },
        },
        by_institution: {
          terms: {
            field: "sponsorOrgUnit.name",
            size: TOP_SIZE,
            order: { _count: "desc" },
          },
          aggs: {
            by_type: { terms: { field: "type", size: 10 } },
          },
        },
      },
    });

    const aggregations = response.aggregations as Aggregations | undefined;
    const rawTotal = response.hits?.total;
    const total = typeof rawTotal === "number" ? rawTotal : rawTotal?.value ?? 0;

    const items: ThesisInstitutionPoint[] = (aggregations?.by_institution?.buckets ?? [])
      .map((bucket) => {
        const name = String(bucket.key_as_string ?? bucket.key ?? "").trim();
        const typeBuckets = bucket.by_type?.buckets;
        return {
          name,
          dissertations: bucketCount(typeBuckets, "Dissertação"),
          theses: bucketCount(typeBuckets, "Tese"),
        };
      })
      .filter((item) => item.name.length > 0);

    return res.status(200).json({
      items,
      withInstitution: aggregations?.with_institution?.doc_count ?? 0,
      total,
    });
  } catch (error: unknown) {
    logger.error("[dashboard/theses-institutions] falha ao carregar o painel");
    logger.error(error);
    return res.status(500).json({ error: "Falha ao carregar o painel." });
  }
}
