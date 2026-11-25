import { useCallback, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "next-i18next";
import type { ECharts, EChartsOption } from "echarts";
import dynamic from "next/dynamic";
import { useTheme } from "../../contexts/ThemeContext";
import useRequest from "../../hooks/useRequest";
import { withBasePath } from "../../lib/basePath";
import type { ThesisByYearResponse } from "../../types/ThesesDashboard";
import ChartExportMenu from "./ChartExportMenu";
import ChartFeedback from "./ChartFeedback";
import {
  PANEL_CHART_BORDERS,
  PRIMARY_CHART_COLOR,
  chartFillColor,
  hexToRgba,
} from "./publicationsChartConfig";

const EChart = dynamic(() => import("./EChart"), { ssr: false });

type Props = {
  height?: number;
};

export default function ThesesByYearChart({ height = 360 }: Props) {
  const { t, i18n } = useTranslation("common");
  const { resolvedTheme } = useTheme();
  const { data, loading, error, get } = useRequest<ThesisByYearResponse>();
  const chartRef = useRef<ECharts | null>(null);

  useEffect(() => {
    get(withBasePath("/api/dashboard/theses-by-year"));
  }, [get]);

  const handleChartReady = useCallback((chart: ECharts | null) => {
    chartRef.current = chart;
  }, []);

  const locale = i18n.language || "pt-BR";
  const items = useMemo(() => data?.items ?? [], [data]);
  const incompleteYear = data?.incompleteYear ?? null;
  const isReady = !loading && !error && items.length > 0;
  const title = t("Theses by year");

  const isDark = resolvedTheme === "dark";
  const textMuted = isDark ? "#a1a1aa" : "#555555";
  const gridColor = isDark ? "#2f3542" : "#e5e7eb";
  const tooltipBg = isDark ? "rgba(17, 24, 39, 0.96)" : "rgba(255, 255, 255, 0.98)";
  const tooltipBorder = isDark ? "#374151" : "#e2e8f0";
  const tooltipText = isDark ? "#e5e7eb" : "#0f172a";

  const dissertationsLabel = t("Dissertations");
  const thesesLabel = t("Doctoral theses");
  const dissertationBorder = PANEL_CHART_BORDERS[0] ?? PRIMARY_CHART_COLOR;
  const thesisBorder = PANEL_CHART_BORDERS[1] ?? PRIMARY_CHART_COLOR;

  const formatNumber = useCallback(
    (value: number) => new Intl.NumberFormat(locale).format(value),
    [locale],
  );
  const formatPercent = useCallback(
    (value: number) =>
      `${new Intl.NumberFormat(locale, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }).format(value)}%`,
    [locale],
  );

  const totals = useMemo(() => {
    const dissertations = items.reduce((sum, item) => sum + item.dissertations, 0);
    const theses = items.reduce((sum, item) => sum + item.theses, 0);
    const peak = items.reduce(
      (best, item) => {
        const total = item.dissertations + item.theses;
        const bestTotal = best.dissertations + best.theses;
        return total > bestTotal ? item : best;
      },
      items[0] ?? { year: 0, dissertations: 0, theses: 0 },
    );
    return {
      dissertations,
      theses,
      total: dissertations + theses,
      peak,
      peakTotal: peak.dissertations + peak.theses,
    };
  }, [items]);

  const caption = [
    t("Theses by year caption", {
      from: items[0]?.year ?? "—",
      to: items[items.length - 1]?.year ?? "—",
      peakYear: totals.peak?.year ?? "—",
      peak: formatNumber(totals.peakTotal),
      dissertations: formatNumber(totals.dissertations),
      theses: formatNumber(totals.theses),
      dissertationsShare:
        totals.total > 0 ? formatPercent((totals.dissertations / totals.total) * 100) : "—",
      thesesShare: totals.total > 0 ? formatPercent((totals.theses / totals.total) * 100) : "—",
    }),
    incompleteYear ? t("Incomplete year note", { year: incompleteYear }) : "",
  ]
    .filter(Boolean)
    .join(" ");

  const option = useMemo<EChartsOption>(() => {
    const buildSeriesData = (values: number[], borderColor: string) =>
      values.map((value, index) => {
        const year = items[index]?.year;
        if (year !== incompleteYear) return value;
        return {
          value,
          itemStyle: {
            color: hexToRgba(borderColor, isDark ? 0.1 : 0.3),
            borderColor,
            borderType: "dashed" as const,
            borderWidth: 1,
          },
        };
      });

    return {
      aria: { enabled: true, label: { description: `${title}. ${caption}` } },
      color: [dissertationBorder, thesisBorder],
      textStyle: { fontFamily: '"rawline", helvetica, arial, sans-serif', color: textMuted },
      legend: {
        bottom: 0,
        left: "center",
        itemWidth: 12,
        itemHeight: 12,
        textStyle: { color: textMuted, fontSize: 12 },
      },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        backgroundColor: tooltipBg,
        borderColor: tooltipBorder,
        borderWidth: 1,
        padding: [10, 12],
        extraCssText: "border-radius:10px;box-shadow:0 12px 32px rgba(15,23,42,0.28);",
        textStyle: {
          color: tooltipText,
          fontFamily: '"rawline", helvetica, arial, sans-serif',
          fontSize: 13,
        },
        formatter: (params) => {
          const list = Array.isArray(params) ? params : [params];
          const item = items[list[0]?.dataIndex ?? -1];
          if (!item) return "";
          const total = item.dissertations + item.theses;
          const heading = item.year === incompleteYear ? `${item.year}*` : String(item.year);
          return `<strong>${heading}</strong><br/>${t("Theses by year tooltip", {
            total: formatNumber(total),
            dissertations: formatNumber(item.dissertations),
            theses: formatNumber(item.theses),
          })}`;
        },
      },
      grid: { left: 16, right: 16, top: 16, bottom: 40, containLabel: true },
      xAxis: {
        type: "category",
        data: items.map((item) => String(item.year)),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: textMuted,
          fontSize: 11,
          formatter: (value: string) => (Number(value) === incompleteYear ? `${value}*` : value),
        },
      },
      yAxis: {
        type: "value",
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: textMuted,
          fontSize: 12,
          formatter: (value: number) => formatNumber(value),
        },
        splitLine: { lineStyle: { color: gridColor, type: "solid", width: 1 } },
      },
      series: [
        {
          name: dissertationsLabel,
          type: "bar",
          stack: "production",
          barMaxWidth: 36,
          itemStyle: {
            color: chartFillColor(dissertationBorder, resolvedTheme),
            borderColor: dissertationBorder,
            borderWidth: 1,
            borderRadius: 0,
          },
          data: buildSeriesData(
            items.map((item) => item.dissertations),
            dissertationBorder,
          ),
        },
        {
          name: thesesLabel,
          type: "bar",
          stack: "production",
          barMaxWidth: 36,
          itemStyle: {
            color: chartFillColor(thesisBorder, resolvedTheme),
            borderColor: thesisBorder,
            borderWidth: 1,
            borderRadius: 0,
          },
          data: buildSeriesData(
            items.map((item) => item.theses),
            thesisBorder,
          ),
        },
      ],
    };
  }, [
    caption,
    dissertationBorder,
    dissertationsLabel,
    formatNumber,
    gridColor,
    incompleteYear,
    isDark,
    items,
    resolvedTheme,
    t,
    textMuted,
    thesesLabel,
    thesisBorder,
    title,
    tooltipBg,
    tooltipBorder,
    tooltipText,
  ]);

  const exportColumns = useMemo(
    () => [
      { key: "year", header: t("Year") },
      { key: "dissertations", header: dissertationsLabel },
      { key: "theses", header: thesesLabel },
      { key: "total", header: t("Total") },
      { key: "dissertationsShare", header: t("Dissertations share") },
      { key: "thesesShare", header: t("Theses share") },
    ],
    [dissertationsLabel, t, thesesLabel],
  );

  const exportRows = useMemo(
    () =>
      items.map((item) => {
        const total = item.dissertations + item.theses;
        return {
          year: item.year,
          dissertations: item.dissertations,
          theses: item.theses,
          total,
          dissertationsShare: total > 0 ? Number(((item.dissertations / total) * 100).toFixed(1)) : 0,
          thesesShare: total > 0 ? Number(((item.theses / total) * 100).toFixed(1)) : 0,
        };
      }),
    [items],
  );

  return (
    <div className="brcris-chart-card h-100">
      <div className="brcris-chart-card__header">
        <div className="brcris-knowledge-areas__heading">
          <h2 className="brcris-chart-card__title">{title}</h2>
          <p className="brcris-knowledge-areas__caption">{caption}</p>
        </div>
        <div className="brcris-chart-card__toggles" role="group">
          <ChartExportMenu
            filename="teses-dissertacoes-por-ano"
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
