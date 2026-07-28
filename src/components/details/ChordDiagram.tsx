"use client";
import * as d3 from "d3";
import { Download, Info } from "lucide-react";
import { useTranslation } from "next-i18next";
import { useEffect, useRef, useState } from "react";
import { Overlay, Popover } from "react-bootstrap";
import coautoriaService from "../../services/CoautoriaService";
import ExpandableContent from "../ExpandableContent";
export default function ChordDiagram({ authorId }: { authorId: string }) {
  const { t } = useTranslation("common");
  const chartRef = useRef<SVGSVGElement | null>(null);
  const [mainAuthor, setMainAuthor] = useState<any>(null);
  const [nodes, setNodes] = useState<any[]>([]);
  const [chords, setChords] = useState<any>(null);

  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [selectedNode, setSelectedNode] = useState<any>(null);

  const handleDownload = () => {
    if (!chartRef.current) return;

    const svg = chartRef.current.querySelector("svg");
    if (!svg) return;

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);

    const blob = new Blob([svgString], {
      type: "image/svg+xml;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${mainAuthor?.name?.replace(/\s+/g, "_")}_coauthorship_network.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const resetGraphStyles = () => {
    if (!chartRef.current) return;

    const svg = d3.select(chartRef.current).select("svg");

    svg
      .selectAll("path")
      .style("opacity", 1)
      .style("stroke", null)
      .style("stroke-width", null);

    svg.selectAll("text").style("fill", "blue").style("font-weight", "normal");
  };
  useEffect(() => {
    if (!authorId) return;

    coautoriaService
      .get(authorId)
      .then((data) => {
        const normalizedName = Array.isArray(data.name)
          ? data.name[0]
          : typeof data.name === "object"
            ? data.name?.raw
            : data.name;

        const normalizedAuthor = {
          ...data,
          name: normalizedName,
        };

        setMainAuthor(normalizedAuthor);

        const newNodes = [
          { id: normalizedAuthor.id, name: normalizedAuthor.name },
          ...normalizedAuthor.coAuthors,
        ];

        const nodeIndex = new Map(newNodes.map((a, i) => [a.id, i]));
        const n = newNodes.length;
        const newMatrix = Array.from({ length: n }, () => Array(n).fill(0));

        normalizedAuthor.publications.forEach((pub: any) => {
          for (let i = 0; i < pub.authors.length; i++) {
            for (let j = i + 1; j < pub.authors.length; j++) {
              const idx1 = nodeIndex.get(pub.authors[i]);
              const idx2 = nodeIndex.get(pub.authors[j]);
              if (idx1 !== undefined && idx2 !== undefined) {
                newMatrix[idx1][idx2] += 1;
                newMatrix[idx2][idx1] += 1;
              }
            }
          }
        });

        const chord = d3.chord().padAngle(0.05).sortSubgroups(d3.descending);

        setNodes(newNodes);
        setChords(chord(newMatrix));
      })
      .catch((err) => console.error("Erro ao carregar dados:", err));
  }, [authorId]);

  useEffect(() => {
    if (!chords || !nodes.length) return;

    const width = 600,
      height = 600;
    const innerRadius = Math.min(width, height) * 0.4;
    const outerRadius = innerRadius + 20;

    const arc = d3.arc().innerRadius(innerRadius).outerRadius(outerRadius);
    const ribbon = d3.ribbon().radius(innerRadius);
    const color = d3.scaleOrdinal(d3.schemeCategory10);

    d3.select(chartRef.current).selectAll("*").remove();
    const margin = 200;
    const svg = d3
      .select(chartRef.current)
      .append("svg")
      .attr("viewBox", [
        -margin,
        -margin,
        width + margin * 2,
        height + margin * 2,
      ])
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);

    const group = svg.append("g").selectAll("g").data(chords.groups).join("g");

    group
      .append("path")
      .attr("d", arc)
      //@ts-expect-error
      .attr("fill", (d) => color(d.index))
      //@ts-expect-error
      .attr("class", (d) => `arc-${nodes[d.index].id}`);

    const ribbonGroup = svg
      .append("g")
      .attr("fill-opacity", 0.7)
      .selectAll("g")
      .data(chords)
      .join("g");

    ribbonGroup
      .append("path")
      .attr("d", ribbon)
      //@ts-expect-error
      .attr("fill", (d) => color(d.target.index))
      .attr(
        "class",
        // @ts-expect-error
        (d) => `ribbon-${nodes[d.source.index].id}-${nodes[d.target.index].id}`,
      );

    // Labels
    group
      .append("g")
      .attr("class", "labels")
      .append("text")
      .each((d) => {
        //@ts-expect-error
        d.angle = (d.startAngle + d.endAngle) / 2;
      })
      .attr("dy", ".35em")
      .attr(
        "transform",
        (d) =>
          //@ts-expect-error
          `rotate(${(d.angle * 180) / Math.PI - 90}) translate(${outerRadius + 5})` +
          //@ts-expect-error
          (d.angle > Math.PI ? " rotate(180)" : ""),
      )
      //@ts-expect-error
      .attr("text-anchor", (d) => (d.angle > Math.PI ? "end" : "start"))
      //@ts-expect-error
      .text((d) => nodes[d.index].name)
      .style("fill", "blue")
      .style("text-decoration", "none")
      .style("cursor", "pointer")
      .style("font-size", "0.7rem")

      .on("pointerenter", (event, d: any) => {
        ribbonGroup.selectAll("path").style("opacity", 0.05);

        ribbonGroup
          .selectAll("path")
          .filter(
            (r: any) =>
              r.source.index === d.index || r.target.index === d.index,
          )
          .style("opacity", 1)
          .style("stroke", "#292929")
          .style("stroke-width", 2);

        group.selectAll("path").style("opacity", 0.2);

        group
          .selectAll("path")
          .filter((g: any) => g.index === d.index)
          .style("opacity", 1);
      })
      .on("pointerleave", () => {
        resetGraphStyles();
      })
      .on("click", (event, d: any) => {
        resetGraphStyles();

        setSelectedNode(nodes[d.index]);
        setTarget(event.currentTarget as HTMLElement);
      })
      .append("title")
      .text((d) => {
        //@ts-expect-error
        if (nodes[d.index].id === mainAuthor.id) {
          return `Co-authors: ${mainAuthor.coAuthors.length}`;
        } else {
          const pubs = mainAuthor.publications.filter(
            // @ts-expect-error
            (p) =>
              // @ts-expect-error
              p.authors.includes(nodes[d.index].id) &&
              p.authors.includes(mainAuthor.id),
          );
          return `Publications with ${mainAuthor.name}: ${pubs.length}`;
        }
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chords, nodes]);

  if (!mainAuthor) {
    return null;
  }
  const handleDownloadGraphML = async () => {
    const url = `/api/autor-xml?authorId=${authorId}`;
    const response = await fetch(url);
    const blob = await response.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${mainAuthor?.name?.replace(/\s+/g, "_")}_network.graphml`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  let popoverContent = null;
  if (selectedNode) {
    if (selectedNode.id === mainAuthor.id) {
      popoverContent = (
        <div>
          <div>
            <Popover id="popover-main">
              <Popover.Header as="h3" className="popover-header">
                {selectedNode.name} (Main Author)
              </Popover.Header>
              <Popover.Body>
                {t("Number of co-authors")}: {mainAuthor.coAuthors.length}
              </Popover.Body>
            </Popover>
          </div>
        </div>
      );
    } else {
      const pubs = mainAuthor.publications.filter(
        (p: any) =>
          p.authors.includes(selectedNode.id) &&
          p.authors.includes(mainAuthor.id),
      );
      popoverContent = (
        <div>
          <Popover id="popover-coauthor">
            <Popover.Header as="h3">
              <a href={`/people/${selectedNode.id}`}>{selectedNode.name}</a>
            </Popover.Header>
            <Popover.Body>
              <span>{` ${t("Publications with")} ${mainAuthor.name}: ${pubs.length}`}</span>
              <ul>
                <ExpandableContent
                  initialCount={3}
                  scrollableOnExpand
                  items={pubs?.slice()?.sort((a: any, b: any) => {
                    const dateA = new Date(
                      a.publicationDate?.[0] || 0,
                    ).getTime();
                    const dateB = new Date(
                      b.publicationDate?.[0] || 0,
                    ).getTime();
                    return dateB - dateA;
                  })}
                  renderItem={(publication: any) => (
                    <div key={publication.id} className="publication-item">
                      <a href={`/publications/${publication.id}`}>
                        {publication.title}
                      </a>
                      <div className="publication-meta">
                        {publication.publicationDate?.[0] && (
                          <span>{publication.publicationDate[0]}</span>
                        )}
                        {publication.type?.[0] && (
                          <span className="type"> - {publication.type[0]}</span>
                        )}
                      </div>
                    </div>
                  )}
                />
              </ul>
            </Popover.Body>
          </Popover>
        </div>
      );
    }
  }

  return (
    <div id="coautoria" className="card my-3 p-2">
      <h3 className="header-coautoria">
        <span>
          {t("Co-authorship Network")} - {mainAuthor.name}
        </span>

        <div className="header-actions">
          <span className="action-link" onClick={handleDownload}>
            <Download size={18} />({t("Download as picture")})
          </span>

          <div className="graphml-action" onClick={handleDownloadGraphML}>
            <img src="/images/graphml.svg" alt="GraphML" />
            <span>{t("GraphML file")}</span>
          </div>
        </div>
      </h3>

      {/** @ts-ignore */}
      <div ref={chartRef}></div>
      <div
        className="text-muted mt-2"
        style={{
          fontSize: "0.85rem",
          display: "flex",
          alignItems: "flex-start",
          gap: "6px",
        }}
      >
        <Info size={14} style={{ marginTop: "2px", flexShrink: 0 }} />
        <span>
          Para melhor visualização, o gráfico apresenta apenas os 50 principais
          coautores. A rede completa pode ser acessada pela exportação em
          GraphML, disponível no canto superior direito.
        </span>
      </div>
      {selectedNode && (
        <Overlay
          show={!!selectedNode}
          target={target}
          placement="auto"
          // @ts-expect-error
          container={chartRef.current}
          rootClose
          onHide={() => {
            setSelectedNode(null);
            resetGraphStyles();
          }}
        >
          {/** @ts-ignore */}
          {popoverContent}
        </Overlay>
      )}
    </div>
  );
}
