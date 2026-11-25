import type { NextApiRequest, NextApiResponse } from "next";
import { createElasticsearchClient } from "../../../services/ElasticsearchClient";
import logger from "../../../services/Logger";
import type {
  ThesesDashboardErrorResponse,
  ThesisCoursePoint,
  ThesisCoursesResponse,
} from "../../../types/ThesesDashboard";

const client = createElasticsearchClient();

const THESIS_TYPES = ["Tese", "Dissertação"] as const;
const TOP_SIZE = 500;

type TypeBucket = { key?: string | number; doc_count?: number };
type DegreeBucket = { key?: string | number; key_as_string?: string; doc_count?: number };
type CourseBucket = {
  key?: string | number;
  key_as_string?: string;
  doc_count?: number;
  by_type?: { buckets?: TypeBucket[] };
  by_degree?: { buckets?: DegreeBucket[] };
};
type Aggregations = {
  with_course?: { doc_count?: number };
  by_course?: { buckets?: CourseBucket[] };
};

function bucketCount(buckets: TypeBucket[] | undefined, key: string) {
  return buckets?.find((bucket) => String(bucket.key) === key)?.doc_count ?? 0;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ThesisCoursesResponse | ThesesDashboardErrorResponse>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Metodo nao permitido." });
  }

  const index = process.env.INDEX_PUBLICATION;

  if (!index) {
    logger.error("[dashboard/theses-courses] INDEX_PUBLICATION is not configured");
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
        with_course: {
          filter: { exists: { field: "course.name" } },
        },
        by_course: {
          terms: {
            field: "course.name",
            size: TOP_SIZE,
            order: { _count: "desc" },
          },
          aggs: {
            by_type: { terms: { field: "type", size: 10 } },
            by_degree: {
              terms: { field: "course.degree", size: 1, order: { _count: "desc" } },
            },
          },
        },
      },
    });

    const aggregations = response.aggregations as Aggregations | undefined;
    const rawTotal = response.hits?.total;
    const total = typeof rawTotal === "number" ? rawTotal : rawTotal?.value ?? 0;

    const items: ThesisCoursePoint[] = (aggregations?.by_course?.buckets ?? [])
      .map((bucket) => {
        const name = String(bucket.key_as_string ?? bucket.key ?? "").trim();
        const typeBuckets = bucket.by_type?.buckets;
        const topDegree = bucket.by_degree?.buckets?.[0];
        const degreeRaw = String(topDegree?.key_as_string ?? topDegree?.key ?? "").trim();
        return {
          name,
          degree: degreeRaw.length > 0 ? degreeRaw : null,
          dissertations: bucketCount(typeBuckets, "Dissertação"),
          theses: bucketCount(typeBuckets, "Tese"),
        };
      })
      .filter((item) => item.name.length > 0);

    return res.status(200).json({
      items,
      withCourse: aggregations?.with_course?.doc_count ?? 0,
      total,
    });
  } catch (error: unknown) {
    logger.error("[dashboard/theses-courses] falha ao carregar o painel");
    logger.error(error);
    return res.status(500).json({ error: "Falha ao carregar o painel." });
  }
}
