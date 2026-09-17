import type { NextApiRequest, NextApiResponse } from "next";
import { createElasticsearchClient } from "../../services/ElasticsearchClient";
import logger from "../../services/Logger";

const client = createElasticsearchClient();

const autorXML = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { authorId } = req.query as { authorId: string };

    const response = await client.search({
      index: process.env.INDEX_PUBLICATION || "",
      _source: ["id", "title", "author", "publicationDate"],
      size: 10000,
      query: { match: { "author.id": authorId } },
    });

    const hits = response.hits.hits.map((h: any) => h._source);
    if (!hits.length) return res.send("<graphml></graphml>");

    const protocol = req.headers["x-forwarded-proto"] || "http";
    const host = req.headers.host;

    const baseUrl = `${protocol}://${host}`;
    let graphml = `<?xml version="1.0" encoding="UTF-8"?>
      <graphml xmlns="http://graphml.graphdrawing.org/xmlns"
            xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
            xsi:schemaLocation="http://graphml.graphdrawing.org/xmlns
            http://graphml.graphdrawing.org/xmlns/1.0/graphml.xsd">

      <key attr.name="label" attr.type="string" for="node" id="label"/>
      <key attr.name="url" attr.type="string" for="node" id="url"/>
      <key attr.name="number_of_authored_works" attr.type="int" for="node" id="number_of_authored_works"/>
      <key attr.name="earliest_publication" attr.type="int" for="node" id="earliest_publication"/>
      <key attr.name="latest_publication" attr.type="int" for="node" id="latest_publication"/>
      <key attr.name="num_earliest_publication" attr.type="int" for="node" id="num_earliest_publication"/>
      <key attr.name="num_latest_publication" attr.type="int" for="node" id="num_latest_publication"/>
      <key attr.name="collaborator1" attr.type="string" for="edge" id="collaborator1"/>
      <key attr.name="collaborator2" attr.type="string" for="edge" id="collaborator2"/>
      <key attr.name="number_of_coauthored_works" attr.type="int" for="edge" id="number_of_coauthored_works"/>
      <key attr.name="earliest_collaboration" attr.type="int" for="edge" id="earliest_collaboration"/>
      <key attr.name="num_earliest_collaboration" attr.type="int" for="edge" id="num_earliest_collaboration"/>
      <key attr.name="latest_collaboration" attr.type="int" for="edge" id="latest_collaboration"/>
      <key attr.name="num_latest_collaboration" attr.type="int" for="edge" id="num_latest_collaboration"/>
      
      <graph edgedefault="undirected">
    `;

    const coAuthorsMap = new Map<string, string>();
    hits.forEach((pub: any) => {
      pub.author.forEach((a: any) => {
        const authorName =
          Array.isArray(a.name) && a.name.length ? a.name[0] : "Sem nome";
        coAuthorsMap.set(a.id, authorName);
      });
    });

    const todosNos: { id: string; name: string }[] = [];
    if (coAuthorsMap.has(authorId)) {
      todosNos.push({ id: authorId, name: coAuthorsMap.get(authorId)! });
    }
    coAuthorsMap.forEach((name, id) => {
      if (id !== authorId) todosNos.push({ id, name });
    });

    todosNos.forEach((node) => {
      const pubs = hits.filter((p: any) =>
        p.author.some((a: any) => a.id === node.id),
      );
      const years = pubs
        .map((p: any) => Number(p.publicationDate))
        .filter((y: number) => !isNaN(y));

      const earliest = years.length ? Math.min(...years) : 0;
      const latest = years.length ? Math.max(...years) : 0;
      const numWorks = pubs.length;
      const numEarliest = years.filter((y: number) => y === earliest).length;
      const numLatest = years.filter((y: number) => y === latest).length;

      graphml += `
  <node id="${node.id}">
    <data key="label">${node.name}</data>
    <data key="url">${baseUrl}/people/${node.id}</data>
    <data key="number_of_authored_works">${numWorks}</data>
    <data key="earliest_publication">${earliest}</data>
    <data key="latest_publication">${latest}</data>
    <data key="num_earliest_publication">${numEarliest}</data>
    <data key="num_latest_publication">${numLatest}</data>
  </node>`;
    });

    const coAuthors = todosNos.filter((n) => n.id !== authorId);
    coAuthors.forEach((coAuthor) => {
      const sharedPubs = hits.filter(
        (p: any) =>
          p.author.some((a: any) => a.id === authorId) &&
          p.author.some((a: any) => a.id === coAuthor.id),
      );
      if (!sharedPubs.length) return;

      const years = sharedPubs
        .map((p: any) => Number(p.publicationDate))
        .filter((y: number) => !isNaN(y));
      const earliest = years.length ? Math.min(...years) : 0;
      const latest = years.length ? Math.max(...years) : 0;
      const numEarliest = years.filter((y: any) => y === earliest).length;
      const numLatest = years.filter((y: any) => y === latest).length;

      graphml += `
  <edge source="${authorId}" target="${coAuthor.id}">
    <data key="collaborator1">${coAuthorsMap.get(authorId)}</data>
    <data key="collaborator2">${coAuthorsMap.get(coAuthor.id)}</data>
    <data key="number_of_coauthored_works">${sharedPubs.length}</data>
    <data key="earliest_collaboration">${earliest}</data>
    <data key="num_earliest_collaboration">${numEarliest}</data>
    <data key="latest_collaboration">${latest}</data>
    <data key="num_latest_collaboration">${numLatest}</data>
  </edge>`;
    });

    graphml += `
  </graph>
</graphml>`;

    res.setHeader("Content-Type", "application/xml");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="coauthorship-network-${authorId}.graphml"`,
    );

    res.status(200).send(graphml);
  } catch (err: any) {
    logger.error(err);
    res.status(400).json({ error: err.message });
  }
};

export default autorXML;
