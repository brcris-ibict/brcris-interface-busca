import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "next-i18next";
import type { ECharts, EChartsOption } from "echarts";
import dynamic from "next/dynamic";
import { Hash, Percent } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import useRequest from "../../hooks/useRequest";
import { withBasePath } from "../../lib/basePath";
import type { SoftwareSectorLanguageResponse } from "../../types/SoftwareDashboard";
import ChartExportMenu from "./ChartExportMenu";
import ChartFeedback from "./ChartFeedback";
import { BRCRIS_PALETTE } from "./publicationsChartConfig";

const EChart = dynamic(() => import("./EChart"), { ssr: false });

type Metric = "share" | "count";

const METRIC_TOGGLES: { metric: Metric; Icon: typeof Percent; labelKey: string }[] = [
  { metric: "share", Icon: Percent, labelKey: "Share of sector" },
  { metric: "count", Icon: Hash, labelKey: "Software count" },
];

const LABEL_MAX_CHARS = 32;

function shortenLabel(name: string) {
  if (name.length <= LABEL_MAX_CHARS) return name;
  return `${name.slice(0, LABEL_MAX_CHARS - 1)}…`;
}

type Props = {
  height?: number;
};

export default function SoftwareSectorLanguageHeatmap({ height = 420 }: Props) {
  const { t, i18n } = useTranslation("common");
  const { resolvedTheme } = useTheme();
  const { data, loading, error, get } = useRequest<SoftwareSectorLanguageResponse>();
  const [metric, setMetric] = useState<Metric>("share");
  const chartRef = useRef<ECharts | null>(null);

  useEffect(() => {
    get(withBasePath("/api/dashboard/software-sector-languages"));
  }, [get]);

  const handleChartReady = useCallback((chart: ECharts | null) => {
    chartRef.current = chart;
  }, []);

  const locale = i18n.language || "pt-BR";
  const isDark = resolvedTheme === "dark";
  const textMuted = isDark ? "#a1a1aa" : "#555555";
  const gridColor = isDark ? "#2f3542" : "#e5e7eb";
  const cellSeparator = isDark ? "#171b22" : "#fefefe";
  const title = t("Sector language heatmap");

  const sectors = useMemo(() => data?.sectors ?? [], [data]);
  const languages = useMemo(() => data?.languages ?? [], [data]);
  const withSector = data?.withSector ?? 0;
  const total = data?.total ?? 0;

  const formatNumber = useCallback(
    (value: number) => new Intl.NumberFormat(locale).format(value),
    [locale],
  );
  const formatPercent = useCallback(
    (value: number) =>
      `${new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value)}%`,
    [locale],
  );

  const points = useMemo(() => {
    const sectorIndex = new Map(sectors.map((sector, index) => [sector.name, index]));
    const languageIndex = new Map(languages.map((language, index) => [language, index]));
    return (data?.cells ?? []).flatMap((cell) => {
      const y = sectorIndex.get(cell.sector);
      const x = languageIndex.get(cell.language);
      if (x === undefined || y === undefined) return [];
      const sectorTotal = sectors[y].total;
      return [
        {
          x,
          y,
          sector: cell.sector,
          language: cell.language,
          count: cell.count,
          share: sectorTotal > 0 ? (cell.count / sectorTotal) * 100 : 0,
        },
      ];
    });
  }, [data, languages, sectors]);

  const isReady = !loading && !error && points.length > 0;

  const caption = t("Sector language caption", {
    value: formatNumber(withSector),
    share: total > 0 ? formatPercent((withSector / total) * 100) : "—",
  });

  const option = useMemo<EChartsOption>(() => {
    const metricValue = (point: (typeof points)[number]) =>
      metric === "share" ? point.share : point.count;
    const maxValue = Math.max(1, ...points.map(metricValue));
    const formatMetric = (value: number) =>
      metric === "share" ? `${Math.round(value)}%` : formatNumber(value);
    // A escala clara termina em azul escuro e a escura termina em azul claro: o texto inverte junto.
    const labelColorFor = (ratio: number) =>
      isDark ? (ratio > 0.6 ? "#111827" : "#ffffff") : ratio > 0.6 ? "#ffffff" : "#1f2937";

    return {
      aria: { enabled: true, label: { description: `${title}. ${caption}` } },
      textStyle: {
        fontFamily: '"rawline", helvetica, arial, sans-serif',
        color: textMuted,
      },
      tooltip: {
        position: "top",
        formatter: (params) => {
          const point = points[(Array.isArray(params) ? params[0] : params)?.dataIndex ?? -1];
          if (!point) return "";
          return `<strong>${point.sector}</strong><br/>${point.language}<br/>${t("Sector language tooltip", {
            value: formatNumber(point.count),
            share: formatPercent(point.share),
          })}`;
        },
      },
      grid: { top: 8, bottom: 56, left: 8, right: 16, containLabel: true },
      xAxis: {
        type: "category",
        data: languages,
        splitArea: { show: false },
        axisTick: { show: false },
        axisLine: { lineStyle: { color: gridColor } },
        axisLabel: { color: textMuted, fontSize: 11, interval: 0, rotate: 30 },
      },
      yAxis: {
        type: "category",
        data: sectors.map((sector) => shortenLabel(sector.name)),
        inverse: true,
        splitArea: { show: false },
        axisTick: { show: false },
        axisLine: { lineStyle: { color: gridColor } },
        axisLabel: { color: textMuted, fontSize: 11 },
      },
      visualMap: {
        min: 0,
        max: maxValue,
        calculable: true,
        orient: "horizontal",
        left: "center",
        bottom: 0,
        itemHeight: 160,
        formatter: (value) => formatMetric(Number(value)),
        inRange: {
          color: isDark
            ? ["#0b1e36", "#0e3b5e", BRCRIS_PALETTE.primary, "#38bdf8", BRCRIS_PALETTE.softBlue]
            : ["#f0f9ff", BRCRIS_PALETTE.softBlue, "#38bdf8", BRCRIS_PALETTE.primary, BRCRIS_PALETTE.darkBlue],
        },
        textStyle: { color: textMuted },
      },
      series: [
        {
          name: title,
          type: "heatmap",
          itemStyle: { borderColor: cellSeparator, borderWidth: 2 },
          label: {
            show: true,
            fontSize: 10,
            formatter: (params) => {
              const value = (params.value as number[] | undefined)?.[2] ?? 0;
              return formatMetric(value);
            },
          },
          emphasis: {
            itemStyle: { shadowBlur: 10, shadowColor: "rgba(0, 0, 0, 0.5)" },
          },
          data: points.map((point) => {
            const value = metricValue(point);
            return {
              value: [point.x, point.y, Number(value.toFixed(1))],
              label: { color: labelColorFor(value / maxValue) },
            };
          }),
        },
      ],
    };
  }, [
    caption,
    cellSeparator,
    formatNumber,
    formatPercent,
    gridColor,
    isDark,
    languages,
    metric,
    points,
    sectors,
    t,
    textMuted,
    title,
  ]);

  const exportColumns = useMemo(
    () => [
      { key: "sector", header: t("Activity sector") },
      { key: "language", header: t("Programming language") },
      { key: "software", header: t("Software") },
      { key: "share", header: t("Share of sector") },
    ],
    [t],
  );

  const exportRows = useMemo(
    () =>
      points.map((point) => ({
        sector: point.sector,
        language: point.language,
        software: point.count,
        share: Number(point.share.toFixed(1)),
      })),
    [points],
  );

  return (
    <div className="brcris-chart-card h-100">
      <div className="brcris-chart-card__header">
        <div className="brcris-knowledge-areas__heading">
          <h2 className="brcris-chart-card__title">{title}</h2>
          <p className="brcris-knowledge-areas__caption">{caption}</p>
        </div>
        <div className="brcris-chart-card__toggles" role="group">
          {METRIC_TOGGLES.map(({ metric: value, Icon, labelKey }) => (
            <button
              key={value}
              type="button"
              className={metric === value ? "is-active" : undefined}
              title={t(labelKey)}
              aria-label={t(labelKey)}
              aria-pressed={metric === value}
              onClick={() => setMetric(value)}
            >
              <Icon size={18} />
            </button>
          ))}
          <ChartExportMenu
            filename="setor-de-atividade-por-linguagem"
            columns={exportColumns}
            rows={exportRows}
            getChart={() => chartRef.current}
            imageTitle={title}
            disabled={!isReady}
          />
        </div>
      </div>
      <div className="brcris-chart-card__body" aria-busy={loading}>
        <ChartFeedback height={height} loading={loading} error={Boolean(error)} empty={points.length === 0} />
        {isReady ? <EChart option={option} height={height} onChartReady={handleChartReady} /> : null}
      </div>
    </div>
  );
}
