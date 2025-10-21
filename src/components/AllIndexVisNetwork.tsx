/* eslint-disable react-hooks/exhaustive-deps */
/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <explanation> */
/* eslint-disable react/jsx-no-comment-textnodes */
/* eslint-disable @typescript-eslint/ban-ts-comment */

import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { useEffect, useState } from "react";
import type { Edge, Node, Options } from "vis";
import "vis-network/styles/vis-network.css";
import { replaceSpacesWithHyphens } from "../../utils/Utils";
import indexes from "../configs/Indexes";
import ElasticSearchStatsService from "../services/ElasticSearchStatsService";

// @ts-expect-error
const Graph = dynamic(import("react-graph-vis"), { ssr: false });

type IndexStat = {
  index: string;
  "docs.count": number;
};

interface IndexNode extends Node {
  index: string;
  indexLabel: string;
}

// Exemplo https://codesandbox.io/s/vis-test-fhir-test-2-forked-0m1l1x?file=/src/index.js:1774-1820
const nodes: IndexNode[] = [
  {
    id: 1,
    index: process.env.INDEX_PUBLICATION || "",
    indexLabel:
      indexes.find((i) => i.name === process.env.INDEX_PUBLICATION)?.label ||
      "",
    label: "",
    title: "100",
    widthConstraint: 130,
    level: 1,
    shape: "circle",
    color: "orange",
    font: {
      color: "#fff",
      size: 14,
    },
  },
  {
    id: 2,
    index: process.env.INDEX_PERSON || "",
    indexLabel:
      indexes.find((i) => i.name === process.env.INDEX_PERSON)?.label || "",
    label: "",
    size: 200,
    title: "100",
    widthConstraint: 110,
    level: 2,
    shape: "circle",
    color: "#009688",
    font: {
      color: "#fff",
      size: 14,
    },
  },
  {
    id: 3,
    index: process.env.INDEX_JOURNAL || "",
    indexLabel:
      indexes.find((i) => i.name === process.env.INDEX_JOURNAL)?.label || "",
    label: "",
    title: "100",
    widthConstraint: 95,
    level: 3,
    shape: "circle",
    color: "#FF5757",
    font: {
      color: "#fff",
      size: 14,
    },
  },
  {
    id: 4,
    index: process.env.INDEX_ORGUNIT || "",
    indexLabel:
      indexes.find((i) => i.name === process.env.INDEX_ORGUNIT)?.label || "",
    label: "",
    title: "100",
    widthConstraint: 95,
    level: 4,
    shape: "circle",
    color: "#960080",
    font: {
      color: "#fff",
      size: 14,
    },
  },
  {
    id: 5,
    index: process.env.INDEX_PATENT || "",
    indexLabel:
      indexes.find((i) => i.name === process.env.INDEX_PATENT)?.label || "",
    label: "",
    title: "100",
    widthConstraint: 100,
    level: 5,
    shape: "circle",
    color: "#03a9f4",
    font: {
      color: "#fff",
      size: 14,
    },
  },
  {
    id: 6,
    index: process.env.INDEX_PROGRAM || "",
    indexLabel:
      indexes.find((i) => i.name === process.env.INDEX_PROGRAM)?.label || "",
    label: "",
    title: "100",
    widthConstraint: 95,
    level: 6,
    shape: "circle",
    color: "#CB6CE6",
    font: {
      color: "#fff",
      size: 14,
    },
  },
  {
    id: 7,
    index: process.env.INDEX_GROUP || "",
    indexLabel:
      indexes.find((i) => i.name === process.env.INDEX_GROUP)?.label || "",
    label: "",
    title: "100",
    widthConstraint: 95,
    level: 7,
    shape: "circle",
    color: "#6610f2",
    font: {
      color: "#fff",
      size: 14,
    },
  },
  {
    id: 8,
    index: process.env.INDEX_SOFTWARE || "",
    indexLabel:
      indexes.find((i) => i.name === process.env.INDEX_SOFTWARE)?.label || "",
    label: "",
    title: "100 ",
    widthConstraint: 95,
    level: 8,
    shape: "circle",
    color: "#6f42c1",
    font: {
      color: "#fff",
      size: 14,
    },
  },
];

const edges: Edge = [
  { from: 1, to: 2, id: 1 },
  { from: 6, to: 4, id: 3 },
  { from: 4, to: 2, id: 4 },
  { from: 1, to: 3, id: 5 },
  { from: 5, to: 2, id: 10 },
  { from: 7, to: 2, id: 13 },
  { from: 8, to: 2, id: 15 },
  { from: 2, to: 3, id: 16 },
  { from: 2, to: 6, id: 17 },
  { from: 1, to: 4, id: 18 },
];

const options: Options = {
  width: "100%",
  height: "100%",
  edges: {
    color: "#210d41",
    smooth: {
      enabled: true,
      type: "continuous",
      roundness: 0,
    },
    arrows: {
      to: { enabled: false },
      from: { enabled: false },
      middle: { enabled: false },
    },
  },
  nodes: {
    shape: "dot",
    size: 32,
  },
  interaction: {
    hover: true,
  },
  layout: {
    hierarchical: {
      enabled: false,
      nodeSpacing: 100,
    },
  },
};

function VisGraph() {
  const router = useRouter();
  const [graph, setGraph] = useState({ nodes, edges });
  const [indexesStats, setIndexesStats] = useState<IndexStat[]>([]);
  const { t } = useTranslation("common");
  const numberFormat = new Intl.NumberFormat("pt-BR");

  const events = {
    click: (event: any) => {
      if (event.nodes[0]) {
        const indexLabel = nodes[event.nodes[0] - 1].indexLabel;
        router.push(`/${replaceSpacesWithHyphens(indexLabel.toLowerCase())}`);
      }
    },
  };

  useEffect(() => {
    const localIndexesStats = localStorage.getItem("indexesStats");
    if (localIndexesStats) {
      setIndexesStats(JSON.parse(localIndexesStats));
      return;
    }
    const indexesName = nodes.map((node) => node.index);
    ElasticSearchStatsService(indexesName)
      .then((res) => {
        localStorage.setItem("indexesStats", JSON.stringify(res));
        setIndexesStats(res);
      })
      .catch((err) => {
        console.error(err);
      });
  }, []);

  useEffect(() => {
    const newNodes: IndexNode[] = [];
    // const maxSizeOfNode = Math.max(...indexesStats.map((item) => item['docs.count']));
    for (let i = 0; i < nodes.length; i++) {
      const indexStat = indexesStats.find(
        (item) => item.index === nodes[i].index,
      );
      if (indexStat) {
        nodes[i].title = `${numberFormat.format(indexStat["docs.count"])} `;
        // nodes[i].widthConstraint = getSizeOfNode(maxSizeOfNode, indexStat['docs.count']);
      }
      nodes[i].label = t(nodes[i].indexLabel);
      if (!nodes[i].title?.includes(nodes[i].label as string)) {
        (nodes[i] as { title: string; label: string }).title += nodes[i].label;
      }
      newNodes.push({ ...nodes[i] });
    }

    setGraph({ ...graph, nodes: newNodes });
  }, [t, indexesStats]);

  return (
    <div className="graph">
      {/**
             // @ts-ignore */}
      <Graph graph={graph} options={options} events={events} />
    </div>
  );
}

export default VisGraph;
