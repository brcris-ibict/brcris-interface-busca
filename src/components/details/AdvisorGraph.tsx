"use client";

import * as d3 from "d3";
import { useTranslation } from "next-i18next";
import { useEffect, useRef, useState } from "react";

type Advisee = {
  id: string;
  name: string;
  uri: string;
  level: number;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
};

type Link = {
  source: string | Advisee;
  target: string | Advisee;
};

interface AdvisingGraphProps {
  advisorName: string;
  advisorUri: string;
  advisees: { adviseeName: string; advisee: string; level: string }[];
}

function AdvisingGraph({
  advisorName,
  advisorUri,
  advisees,
}: AdvisingGraphProps) {
  const ref = useRef<SVGSVGElement | null>(null);
  const { t } = useTranslation("common");

  useEffect(() => {
    if (!ref.current) return;

    const width = 1400;
    const height = 1000;

    const nodes: Advisee[] = [
      {
        id: "1",
        name: advisorName,
        uri: advisorUri,
        level: 1,
        x: width / 2,
        y: height / 2,
      },
      ...advisees.map((a, i) => {
        const tipo = (a.level || "").toLowerCase();

        let nivel = 3;
        if (tipo.includes("tese")) nivel = 2;
        if (tipo.includes("disser")) nivel = 3;

        return {
          id: (i + 2).toString(),
          name: a.adviseeName,
          uri: a.advisee,
          level: nivel,
        };
      }),
    ];

    const links: Link[] = advisees.map((_, i) => ({
      source: "1",
      target: (i + 2).toString(),
    }));

    const color = (level: number) => {
      switch (level) {
        case 1:
          return "#1f77b4";
        case 2:
          return "#ff7f0e";
        case 3:
          return "#2ca02c";
        default:
          return "#999";
      }
    };

    const handleDownload = () => {
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(ref.current!);
      const blob = new Blob([svgString], {
        type: "image/svg+xml;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${advisorName.replace(/\s+/g, "_")}_advising_network.svg`;
      a.click();
      URL.revokeObjectURL(url);
    };

    const svg = d3
      .select(ref.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .attr(
        "style",
        "width:100%; height:auto; background:white; font-family:sans-serif; display:block; margin:auto;",
      );

    svg.selectAll("*").remove();

    svg.selectAll("*").remove();

    const headerGroup = svg.append("g").attr("transform", "translate(60, 20)");

    const titleText = headerGroup
      .append("text")
      .attr("x", -50)
      .attr("y", 5)
      .attr("fill", "#1f2937")
      .attr("font-size", 20)
      .attr("font-weight", "600")
      .attr("text-anchor", "start")
      .text(
        `${t("Master and Doctoral Theses Advising Network")} - ${advisorName}`,
      );

    const titleWidth = (titleText.node() as SVGTextElement).getBBox().width;

    headerGroup
      .append("text")
      .attr("x", titleWidth + -40)
      .attr("y", 5)
      .attr("fill", "#6a0dad")
      .attr("font-size", 16)
      .attr("font-weight", "normal")
      .attr("text-anchor", "start")
      .style("cursor", "pointer")
      .text(`(${t("Download as picture")})`)
      .on("click", handleDownload)
      .on("mouseover", function () {
        d3.select(this).attr("text-decoration", "underline");
      })
      .on("mouseout", function () {
        d3.select(this).attr("text-decoration", "none");
      });

    const legendData = [
      { color: "#1f77b4", text: t("Advisor") },
      { color: "#ff7f0e", text: t("Doctoral thesis") },
      { color: "#2ca02c", text: t("Master thesis") },
    ];

    const legend = svg
      .append("g")
      .attr("transform", `translate(${width - 250}, 50)`);

    legend
      .selectAll("circle")
      .data(legendData)
      .join("circle")
      .attr("cx", 0)
      .attr("cy", (_, i) => i * 25)
      .attr("r", 7)
      .attr("fill", (d) => d.color);

    legend
      .selectAll("text")
      .data(legendData)
      .join("text")
      .attr("x", 15)
      .attr("y", (_, i) => i * 25 + 4)
      .attr("font-size", 15)
      .attr("fill", "#333")
      .text((d) => d.text);

    const graphOffsetY = 40;

    const simulation = d3
      .forceSimulation<Advisee>(nodes)
      .force(
        "link",
        d3
          .forceLink<Advisee, Link>(links)
          .id((d) => d.id)
          .distance(300),
      )
      .force("charge", d3.forceManyBody().strength(-1800))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(35));

    const link = svg
      .append("g")
      .attr("transform", `translate(0, ${graphOffsetY})`)
      .attr("stroke", "#ccc")
      .attr("stroke-width", 1)
      .selectAll("line")
      .data(links)
      .join("line");

    const node = svg
      .append("g")
      .attr("transform", `translate(0, ${graphOffsetY})`)
      .selectAll("g")
      .data(nodes)
      .join("g");

    node
      .append("circle")
      .attr("r", 12)
      .attr("fill", (d) => color(d.level));

    node;
    node
      .append("a")
      .attr("xlink:href", (d) => `/people/${d.uri}`)
      .append("text")
      .text((d) => d.name)
      .attr("x", 18)
      .attr("y", 5)
      .attr("font-size", 14)
      .attr("fill", "blue")
      .style("cursor", "pointer")
      .style("text-decoration", "none")
      .on("mouseover", function () {
        d3.select(this).style("text-decoration", "underline");
      })
      .on("mouseout", function () {
        d3.select(this).style("text-decoration", "none");
      });
    node.append("title").text((d) => d.name);

    const drag = d3
      .drag<SVGGElement, Advisee>()
      .on("start", (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on("drag", (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on("end", (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    node.call(drag as any);

    simulation.nodes(nodes).on("tick", () => {
      link
        .attr("x1", (d) =>
          typeof d.source === "object" ? (d.source.x ?? 0) : 0,
        )
        .attr("y1", (d) =>
          typeof d.source === "object" ? (d.source.y ?? 0) : 0,
        )
        .attr("x2", (d) =>
          typeof d.target === "object" ? (d.target.x ?? 0) : 0,
        )
        .attr("y2", (d) =>
          typeof d.target === "object" ? (d.target.y ?? 0) : 0,
        );

      node.attr("transform", (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });

    (simulation.force("link") as d3.ForceLink<Advisee, Link>).links(links);
  }, [advisorName, advisorUri, advisees, t]);

  return <svg ref={ref} role="img" />;
}

export default function AdvisorGraph({ advisorId }: { advisorId: string }) {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!advisorId) return;
    fetch(`/api/orientacoes?advisorId=${advisorId}`)
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch(() => setData(null));
  }, [advisorId]);

  if (!data || !data.advisees?.length) return null;

  return (
    <div
      id="orientacoes"
      className="p-6 flex flex-col items-center justify-center w-full"
    >
      <AdvisingGraph
        advisorName={data.name}
        advisorUri={data.id}
        advisees={data.advisees.map((a: any) => ({
          adviseeName: a.name,
          advisee: a.id,
          level: a.type,
        }))}
      />
    </div>
  );
}
