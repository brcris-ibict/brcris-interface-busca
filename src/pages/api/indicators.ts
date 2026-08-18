import type { NextApiRequest, NextApiResponse } from "next";
import { createElasticsearchClient } from "../../services/ElasticsearchClient";
import logger from "../../services/Logger";

const client = createElasticsearchClient();

type RequestData = {
  queries: string[];
  index: string;
};

const proxy = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const data: RequestData = JSON.parse(req.body);
    const queries: any[] = [];
    data.queries.forEach((query) => {
      queries.push({ index: data.index });
      queries.push(query);
    });
    // https://www.elastic.co/docs/reference/elasticsearch/clients/javascript/msearch_examples
    const response = await client.msearch({
      searches: queries,
    });

    const buckets = response.responses.map(
      (resp: any) => resp.aggregations?.aggregate.buckets,
    );
    res.json(buckets);
  } catch (err) {
    logger.error(err);
    res.status(400).json({ error: err.message });
  }
};

export default proxy;
