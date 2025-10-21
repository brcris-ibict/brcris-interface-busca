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
      index: "r3-new-publication",
      _source: ["id", "title", "author"],
      body: {
        query: {
          match: {
            "author.id": authorId,
          },
        },
      },
    });

    console.log(" response", JSON.stringify(response.body.hits.hits, null, 2));

    // @ts-expect-error
    const hits = response.body.hits.hits.map((h) => h._source);

    console.log("hits", hits);

    if (!hits.length) return null;

    // Obter nome do autor principal
    // @ts-expect-error
    const mainAuthorData = hits[0].author.find((a) => a.id === authorId);

    // Montar coAuthors únicos
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

    // Montar publicações com array de ids de autores
    // @ts-expect-error
    const publications = hits.map((pub) => ({
      id: pub.id,
      title: pub.title,
      // @ts-expect-error
      authors: pub.author.map((a) => a.id),
    }));

    // Objeto final
    const result = {
      id: authorId,
      name: mainAuthorData.name,
      coAuthors,
      publications,
    };

    res.json(result);
  } catch (err) {
    logger.error(err);
    res.status(400).json({ error: err.message });
  }
};

export default proxy;
