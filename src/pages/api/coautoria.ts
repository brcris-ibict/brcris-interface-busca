/* eslint-disable @typescript-eslint/ban-ts-comment */

import { Client } from "es7";
import type { NextApiRequest, NextApiResponse } from "next";
import logger from "../../services/Logger";

const client = new Client({
  maxRetries: 5,
  requestTimeout: 60000,
  sniffOnStart: true,
  node: process.env.HOST_ELASTIC,
  auth: {
    apiKey: process.env.API_KEY!,
  },
});

const proxy = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { authorId } = req.query as { authorId: string };
    const response = await client.search({
      index: process.env.INDEX_PUBLICATION || "",
      _source: ["id", "title", "author", "publicationDate"],

      body: {
        query: {
          match: {
            "author.id": authorId,
          },
        },
      },
    });

    // @ts-expect-error
    const hits = response.body.hits.hits.map((h) => h._source);
    const years = hits
      .map((p: any) => Number(p.publicationDate))
      .filter((y: any) => !isNaN(y));

    const earliest_publication = years.length ? Math.min(...years) : null;
    const latest_publication = years.length ? Math.max(...years) : null;

    if (!hits.length) return null;

    // @ts-expect-error
    const mainAuthorData = hits[0].author.find((a) => a.id === authorId);

    const coAuthorsMap = new Map();
    // @ts-expect-error
    hits.forEach((pub) => {
      // @ts-expect-error
      pub.author.forEach((a) => {
        if (a.id !== authorId) coAuthorsMap.set(a.id, a.name);
      });
    });
    const coAuthors = Array.from(coAuthorsMap.entries()).map(([id, name]) => ({
      id,
      name,
    }));

    // @ts-expect-error
    const publications = hits.map((pub) => ({
      id: pub.id,
      title: pub.title,
      publicationDate: pub.publicationDate,

      // @ts-expect-error
      authors: pub.author.map((a) => a.id),
    }));

    const result = {
      id: authorId,
      name: mainAuthorData.name,
      coAuthors,
      publications,
      number_of_authored_works: hits.length,
      earliest_publication,
      latest_publication,
    };

    res.json(result);
  } catch (err) {
    logger.error(err);
    res.status(400).json({ error: err.message });
  }
};

export default proxy;
