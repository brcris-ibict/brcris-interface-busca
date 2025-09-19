/* eslint-disable @typescript-eslint/ban-ts-comment */
'use client';
import * as d3 from 'd3';
import { useEffect, useRef, useState } from 'react';
import { Overlay, Popover } from 'react-bootstrap';
import { Rnd } from 'react-rnd';
import coautoriaService from '../../services/CoautoriaService';

export default function ChordDiagram({ authorId }: { authorId: string }) {
  const chartRef = useRef<SVGSVGElement | null>(null);
  const [mainAuthor, setMainAuthor] = useState<any>(null);
  const [nodes, setNodes] = useState<any[]>([]);
  const [chords, setChords] = useState<any>(null);

  // Popover state
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [popoverPos, setPopoverPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    if (!authorId) return;

    coautoriaService
      .get(authorId)
      .then((data) => {
        setMainAuthor(data);

        const newNodes = [{ id: data.id, name: data.name }, ...data.coAuthors];
        const nodeIndex = new Map(newNodes.map((a, i) => [a.id, i]));
        const n = newNodes.length;
        const newMatrix = Array.from({ length: n }, () => Array(n).fill(0));

        data.publications.forEach((pub: any) => {
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
        const newChords = chord(newMatrix);

        setNodes(newNodes);
        setChords(newChords);
      })
      .catch((err) => console.error('Erro ao carregar dados:', err));
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

    d3.select(chartRef.current).selectAll('*').remove();
    const margin = 200; // margem extra p/ labels
    const svg = d3
      .select(chartRef.current)
      .append('svg')
      .attr('viewBox', [-margin, -margin, width + margin * 2, height + margin * 2])
      .append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    const group = svg.append('g').selectAll('g').data(chords.groups).join('g');

    group
      .append('path')
      .attr('d', arc)
      //@ts-ignore
      .attr('fill', (d) => color(d.index))
      .attr('stroke', '#000')
      //@ts-ignore
      .attr('class', (d) => `arc-${nodes[d.index].id}`);

    const ribbonGroup = svg.append('g').attr('fill-opacity', 0.7).selectAll('g').data(chords).join('g');

    ribbonGroup
      .append('path')
      .attr('d', ribbon)
      //@ts-ignore
      .attr('fill', (d) => color(d.target.index))
      .attr('stroke', '#000')
      //@ts-ignore
      .attr('class', (d) => `ribbon-${nodes[d.source.index].id}-${nodes[d.target.index].id}`);

    // Labels
    group
      .append('g')
      .attr('class', 'labels')
      .append('text')
      .each((d) => {
        //@ts-ignore
        d.angle = (d.startAngle + d.endAngle) / 2;
      })
      .attr('dy', '.35em')
      .attr(
        'transform',
        (d) =>
          //@ts-ignore
          `rotate(${(d.angle * 180) / Math.PI - 90}) translate(${outerRadius + 5})` +
          //@ts-ignore
          (d.angle > Math.PI ? ' rotate(180)' : '')
      )
      //@ts-ignore
      .attr('text-anchor', (d) => (d.angle > Math.PI ? 'end' : 'start'))
      //@ts-ignore
      .text((d) => nodes[d.index].name)
      .style('fill', 'blue')
      .style('text-decoration', 'underline')
      .style('cursor', 'pointer')
      .on('click', function (event, d) {
        //@ts-ignore
        setSelectedNode(nodes[d.index]);
        setTarget(event.currentTarget as HTMLElement);
        //@ts-ignore
        const rect = chartRef.current.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        setPopoverPos({ x, y });

        // 🔥 Highlight logic
        ribbonGroup
          .selectAll('path')
          //@ts-ignore
          .style('opacity', (r: any) => (r.source.index === d.index || r.target.index === d.index ? 1 : 0.1));

        //@ts-ignore
        group.selectAll('path').style('opacity', (g: any) => (g.index === d.index ? 1 : 0.2));
      })
      .append('title')
      .text((d) => {
        //@ts-ignore
        if (nodes[d.index].id === mainAuthor.id) {
          return `Co-authors: ${mainAuthor.coAuthors.length}`;
        } else {
          const pubs = mainAuthor.publications.filter(
            //@ts-ignore
            (p) => p.authors.includes(nodes[d.index].id) && p.authors.includes(mainAuthor.id)
          );
          return `Publications with ${mainAuthor.name}: ${pubs.length}`;
        }
      });
  }, [chords, nodes]);

  if (!mainAuthor) {
    return <p>Loading co-authorship data...</p>;
  }

  // ...

  let popoverContent = null;
  if (selectedNode) {
    if (selectedNode.id === mainAuthor.id) {
      popoverContent = (
        <Rnd default={{ x: popoverPos.x, y: popoverPos.y, width: 300, height: 'auto' }} bounds="window">
          <div>
            <Popover id="popover-main">
              <Popover.Header as="h3" className="popover-header">
                {selectedNode.name} (Main Author)
              </Popover.Header>
              <Popover.Body>Number of co-authors: {mainAuthor.coAuthors.length}</Popover.Body>
            </Popover>
          </div>
        </Rnd>
      );
    } else {
      const pubs = mainAuthor.publications.filter(
        (p: any) => p.authors.includes(selectedNode.id) && p.authors.includes(mainAuthor.id)
      );
      popoverContent = (
        <Rnd default={{ x: popoverPos.x, y: popoverPos.y, width: 300, height: 'auto' }} bounds="window">
          <div>
            <Popover id="popover-coauthor">
              <Popover.Header as="h3" className="popover-header">
                {selectedNode.name} & {mainAuthor.name}
              </Popover.Header>
              <Popover.Body>
                <p>Publications together: {pubs.length}</p>
                <ul>
                  {pubs.map((p: any) => (
                    <li key={p.id}>
                      <a href={`/publications/${p.id}`}>{p.title}</a>
                    </li>
                  ))}
                </ul>
              </Popover.Body>
            </Popover>
          </div>
        </Rnd>
      );
    }
  }

  return (
    <div>
      <h3>{mainAuthor.name} — Co-authorship Graph</h3>
      {/** @ts-ignore */}
      <div ref={chartRef}></div>

      {selectedNode && (
        <Overlay
          show={!!selectedNode}
          target={target}
          placement="auto"
          // @ts-ignore
          container={chartRef.current}
          rootClose
          onHide={() => {
            setSelectedNode(null);

            // 🔄 Reset highlight quando popover fecha
            if (chartRef.current) {
              const svg = d3.select(chartRef.current).select('svg');

              svg.selectAll('path').style('opacity', 1); // restaura todos
            }
          }}
        >
          {/** @ts-ignore */}
          {popoverContent}
        </Overlay>
      )}
    </div>
  );
}
