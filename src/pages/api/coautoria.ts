import type { NextApiRequest, NextApiResponse } from "next";
import { createElasticsearchClient } from "../../services/ElasticsearchClient";
import logger from "../../services/Logger";

const client = createElasticsearchClient();

type Author = {
  id: string;
  name: string;
};

type Publication = {
  id: string;
  title: string | string[];
  author: Author[];
  publicationDate: string | string[];
};

const proxy = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { authorId } = req.query as { authorId: string };

    const response = await client.search<Publication>({
      index: process.env.INDEX_PUBLICATION || "",
      _source: ["id", "title", "author", "publicationDate"],
      size: 10000,
      query: {
        match: {
          "author.id": authorId,
        },
      },
    });

    const hits = response.hits.hits.flatMap((hit) =>
      hit._source ? [hit._source] : [],
    );

    if (!hits.length) return res.json(null);

    const mainAuthorData = hits[0].author.find((a) => a.id === authorId);

    const coAuthorCount: Record<string, { name: string; count: number }> = {};

    hits.forEach((pub) => {
      pub.author.forEach((a) => {
        if (a.id !== authorId) {
          if (!coAuthorCount[a.id]) {
            coAuthorCount[a.id] = { name: a.name, count: 0 };
          }
          coAuthorCount[a.id].count += 1;
        }
      });
    });

    const sortedCoAuthors = Object.entries(coAuthorCount)
      .map(([id, v]) => ({
        id,
        name: v.name,
        count: v.count,
      }))
      .sort((a, b) => b.count - a.count);
    const priority = sortedCoAuthors.filter((a) => a.count >= 2);

    let finalCoAuthors = priority;

    if (priority.length < 50) {
      const remaining = sortedCoAuthors.filter((a) => a.count === 1);

      finalCoAuthors = [
        ...priority,
        ...remaining.slice(0, 50 - priority.length),
      ];
    } else {
      finalCoAuthors = priority.slice(0, 50);
    }

    const coAuthors = finalCoAuthors.map(({ id, name }) => ({
      id,
      name,
    }));

    const validIds = new Set(coAuthors.map((a) => a.id));

    const publications = hits.map((pub) => ({
      id: pub.id,
      title: pub.title,
      publicationDate: pub.publicationDate,
      authors: pub.author
        .map((a) => a.id)
        .filter((id: string) => id === authorId || validIds.has(id)),
    }));

    const years = publications
      .map((p: any) => Number(p.publicationDate))
      .filter((y: any) => !isNaN(y));

    const earliest_publication = years.length ? Math.min(...years) : null;
    const latest_publication = years.length ? Math.max(...years) : null;

    const coauthorshipByYear: Record<string, number> = {};

    publications.forEach((pub: any) => {
      const year = Number(pub.publicationDate);
      if (isNaN(year)) return;

      const hasCoauthor = pub.authors.some((id: string) => id !== authorId);

      if (hasCoauthor) {
        if (!coauthorshipByYear[year]) coauthorshipByYear[year] = 0;
        coauthorshipByYear[year]++;
      }
    });

    const graphData = Object.entries(coauthorshipByYear)
      .map(([year, count]) => ({
        year: Number(year),
        coauthorships: count,
      }))
      .sort((a, b) => a.year - b.year);

    res.json({
      id: authorId,
      name: mainAuthorData?.name ?? "",
      coAuthors,
      publications,
      number_of_authored_works: hits.length,
      coauthors_filtered: coAuthors.length,
      earliest_publication,
      latest_publication,
      graphData,
    });
  } catch (err: any) {
    logger.error(err);
    res.status(400).json({ error: err.message });
  }
};

export default proxy;
