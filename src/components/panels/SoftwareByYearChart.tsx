import { useCallback, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "next-i18next";
import type { ECharts, EChartsOption } from "echarts";
import dynamic from "next/dynamic";
import { useTheme } from "../../contexts/ThemeContext";
import useRequest from "../../hooks/useRequest";
import { withBasePath } from "../../lib/basePath";
import type { SoftwareByYearResponse } from "../../types/SoftwareDashboard";
import ChartExportMenu from "./ChartExportMenu";
import ChartFeedback from "./ChartFeedback";
import {
  BRCRIS_PALETTE,
  PANEL_CHART_BORDERS,
  PRIMARY_CHART_COLOR,
  chartFillColor,
  hexToRgba,
} from "./publicationsChartConfig";

const EChart = dynamic(() => import("./EChart"), { ssr: false });

type Props = {
  height?: number;
};

export default function SoftwareByYearChart({ height = 360 }: Props) {
  const { t, i18n } = useTranslation("common");
  const { resolvedTheme } = useTheme();
  const { data, loading, error, get } = useRequest<SoftwareByYearResponse>();
  const chartRef = useRef<ECharts | null>(null);

  useEffect(() => {
    get(withBasePath("/api/dashboard/software-by-year"));
  }, [get]);

  const handleChartReady = useCallback((chart: ECharts | null) => {
    chartRef.current = chart;
  }, []);

  const locale = i18n.language || "pt-BR";
  const items = useMemo(() => data?.items ?? [], [data]);
  const incompleteYear = data?.incompleteYear ?? null;
  const isReady = !loading && !error && items.length > 0;

  const isDark = resolvedTheme === "dark";
  const textMuted = isDark ? "#a1a1aa" : "#555555";
  const gridColor = isDark ? "#2f3542" : "#e5e7eb";
  const lineColor = isDark ? BRCRIS_PALETTE.lavender : BRCRIS_PALETTE.darkBlue;
  const incompleteFill = hexToRgba(PRIMARY_CHART_COLOR, isDark ? 0.1 : 0.3);
  const depositColor = PANEL_CHART_BORDERS[3];

  const softwareLabel = t("Software");
  const depositsLabel = t("Software deposits");
  const grantedShareLabel = t("Granted share");
  const title = t("Software by year");

  const option = useMemo<EChartsOption>(() => {
    const formatNumber = (value: number) => new Intl.NumberFormat(locale).format(value);
    const formatPercent = (value: number) =>
      `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value)}%`;

    return {
      aria: {
        enabled: true,
        label: { description: `${title}. ${t("Software by year caption")}` },
      },
      textStyle: {
        fontFamily: '"rawline", helvetica, arial, sans-serif',
        color: textMuted,
      },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params) => {
          const list = Array.isArray(params) ? params : [params];
          const item = items[list[0]?.dataIndex ?? -1];
          if (!item) return "";
          const share = item.count > 0 ? formatPercent((item.granted / item.count) * 100) : "—";
          const heading =
            item.year === incompleteYear ? `${item.year} (${t("Incomplete year")})` : String(item.year);
          return [
            `<strong>${heading}</strong>`,
            `${softwareLabel}: ${formatNumber(item.count)}`,
            `${depositsLabel}: ${formatNumber(item.deposits)}`,
            `${t("Granted software")}: ${formatNumber(item.granted)} (${share})`,
          ].join("<br/>");
        },
      },
      legend: {
        top: 0,
        right: 0,
        textStyle: { color: textMuted },
        data: [softwareLabel, depositsLabel, grantedShareLabel],
      },
      grid: { left: 16, right: 16, top: 40, bottom: 24, containLabel: true },
      xAxis: {
        type: "category",
        data: items.map((item) => String(item.year)),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: textMuted,
          fontSize: 12,
          formatter: (value: string) => (Number(value) === incompleteYear ? `${value}*` : value),
        },
      },
      yAxis: [
        {
          type: "value",
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { color: textMuted, fontSize: 12, formatter: (value: number) => formatNumber(value) },
          splitLine: { lineStyle: { color: gridColor, type: "solid", width: 1 } },
        },
        {
          type: "value",
          min: 0,
          max: 100,
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { color: textMuted, fontSize: 12, formatter: "{value}%" },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: softwareLabel,
          type: "bar",
          barMaxWidth: 28,
          barCategoryGap: "30%",
          itemStyle: {
            color: chartFillColor(PRIMARY_CHART_COLOR, resolvedTheme),
            borderColor: PRIMARY_CHART_COLOR,
            borderWidth: 1,
            borderRadius: 0,
          },
          data: items.map((item) =>
            item.year === incompleteYear
              ? {
                  value: item.count,
                  itemStyle: {
                    color: incompleteFill,
                    borderColor: PRIMARY_CHART_COLOR,
                    borderType: "dashed",
                    borderWidth: 1,
                  },
                }
              : item.count,
          ),
        },
        {
          name: depositsLabel,
          type: "line",
          smooth: false,
          symbol: "circle",
          symbolSize: 4,
          lineStyle: { color: depositColor, width: 2, type: "dashed" },
          itemStyle: { color: depositColor },
          data: items.map((item) => item.deposits),
        },
        {
          name: grantedShareLabel,
          type: "line",
          yAxisIndex: 1,
          smooth: false,
          symbol: "circle",
          symbolSize: 5,
          lineStyle: { color: lineColor, width: 2 },
          itemStyle: { color: lineColor },
          data: items.map((item) =>
            item.count > 0 ? Number(((item.granted / item.count) * 100).toFixed(1)) : null,
          ),
        },
      ],
    };
  }, [
    items,
    incompleteYear,
    locale,
    resolvedTheme,
    textMuted,
    gridColor,
    lineColor,
    incompleteFill,
    depositColor,
    softwareLabel,
    depositsLabel,
    grantedShareLabel,
    title,
    t,
  ]);

  const exportColumns = useMemo(
    () => [
      { key: "year", header: t("Year") },
      { key: "software", header: softwareLabel },
      { key: "deposits", header: depositsLabel },
      { key: "granted", header: t("Granted software") },
      { key: "share", header: grantedShareLabel },
    ],
    [depositsLabel, grantedShareLabel, softwareLabel, t],
  );

  const exportRows = useMemo(
    () =>
      items.map((item) => ({
        year: item.year,
        software: item.count,
        deposits: item.deposits,
        granted: item.granted,
        share: item.count > 0 ? Number(((item.granted / item.count) * 100).toFixed(1)) : 0,
      })),
    [items],
  );

  const caption = incompleteYear
    ? `${t("Software by year caption")} ${t("Incomplete year note", { year: incompleteYear })}`
    : t("Software by year caption");

  return (
    <div className="brcris-chart-card h-100">
      <div className="brcris-chart-card__header">
        <div className="brcris-knowledge-areas__heading">
          <h2 className="brcris-chart-card__title">{title}</h2>
          <p className="brcris-knowledge-areas__caption">{caption}</p>
        </div>
        <div className="brcris-chart-card__toggles" role="group">
          <ChartExportMenu
            filename="programas-de-computador-por-ano"
            columns={exportColumns}
            rows={exportRows}
            getChart={() => chartRef.current}
            imageTitle={title}
            disabled={!isReady}
          />
        </div>
      </div>
      <div className="brcris-chart-card__body" aria-busy={loading}>
        <ChartFeedback height={height} loading={loading} error={Boolean(error)} empty={items.length === 0} />
        {isReady ? <EChart option={option} height={height} onChartReady={handleChartReady} /> : null}
      </div>
    </div>
  );
}
