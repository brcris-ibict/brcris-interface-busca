import { useCallback, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "next-i18next";
import type { ECharts, EChartsOption } from "echarts";
import dynamic from "next/dynamic";
import { useTheme } from "../../contexts/ThemeContext";
import useRequest from "../../hooks/useRequest";
import { withBasePath } from "../../lib/basePath";
import type { ArticlesByYearResponse } from "../../types/ThesesDashboard";
import ChartExportMenu from "./ChartExportMenu";
import ChartFeedback from "./ChartFeedback";
import { PRIMARY_CHART_COLOR, chartFillColor, hexToRgba } from "./publicationsChartConfig";

const EChart = dynamic(() => import("./EChart"), { ssr: false });

type Props = {
  height?: number;
};

export default function ArticlesByYearChart({ height = 360 }: Props) {
  const { t, i18n } = useTranslation("common");
  const { resolvedTheme } = useTheme();
  const { data, loading, error, get } = useRequest<ArticlesByYearResponse>();
  const chartRef = useRef<ECharts | null>(null);

  useEffect(() => {
    get(withBasePath("/api/dashboard/articles-by-year"));
  }, [get]);

  const handleChartReady = useCallback((chart: ECharts | null) => {
    chartRef.current = chart;
  }, []);

  const locale = i18n.language || "pt-BR";
  const items = useMemo(() => data?.items ?? [], [data]);
  const incompleteYear = data?.incompleteYear ?? null;
  const isReady = !loading && !error && items.length > 0;
  const title = t("Articles by year");

  const isDark = resolvedTheme === "dark";
  const textMuted = isDark ? "#a1a1aa" : "#555555";
  const gridColor = isDark ? "#2f3542" : "#e5e7eb";
  const tooltipBg = isDark ? "rgba(17, 24, 39, 0.96)" : "rgba(255, 255, 255, 0.98)";
  const tooltipBorder = isDark ? "#374151" : "#e2e8f0";
  const tooltipText = isDark ? "#e5e7eb" : "#0f172a";
  const incompleteFill = hexToRgba(PRIMARY_CHART_COLOR, isDark ? 0.1 : 0.3);

  const formatNumber = useCallback(
    (value: number) => new Intl.NumberFormat(locale).format(value),
    [locale],
  );

  const totals = useMemo(() => {
    const articles = items.reduce((sum, item) => sum + item.articles, 0);
    const peak = items.reduce(
      (best, item) => (item.articles > best.articles ? item : best),
      items[0] ?? { year: 0, articles: 0 },
    );
    return { articles, peak };
  }, [items]);

  const caption = [
    t("Articles by year caption", {
      from: items[0]?.year ?? "—",
      to: items[items.length - 1]?.year ?? "—",
      peakYear: totals.peak?.year ?? "—",
      peak: formatNumber(totals.peak?.articles ?? 0),
      total: formatNumber(totals.articles),
    }),
    incompleteYear ? t("Incomplete year note", { year: incompleteYear }) : "",
  ]
    .filter(Boolean)
    .join(" ");

  const option = useMemo<EChartsOption>(() => {
    return {
      aria: { enabled: true, label: { description: `${title}. ${caption}` } },
      color: [PRIMARY_CHART_COLOR],
      textStyle: { fontFamily: '"rawline", helvetica, arial, sans-serif', color: textMuted },
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
          const point = Array.isArray(params) ? params[0] : params;
          const item = items[point?.dataIndex ?? -1];
          if (!item) return "";
          const heading = item.year === incompleteYear ? `${item.year}*` : String(item.year);
          return `<strong>${heading}</strong><br/>${t("Articles by year tooltip", {
            articles: formatNumber(item.articles),
          })}`;
        },
      },
      grid: { left: 16, right: 16, top: 16, bottom: 24, containLabel: true },
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
          name: t("Articles"),
          type: "bar",
          barMaxWidth: 18,
          itemStyle: {
            color: chartFillColor(PRIMARY_CHART_COLOR, resolvedTheme),
            borderColor: PRIMARY_CHART_COLOR,
            borderWidth: 1,
            borderRadius: 0,
          },
          data: items.map((item) =>
            item.year === incompleteYear
              ? {
                  value: item.articles,
                  itemStyle: {
                    color: incompleteFill,
                    borderColor: PRIMARY_CHART_COLOR,
                    borderType: "dashed" as const,
                    borderWidth: 1,
                  },
                }
              : item.articles,
          ),
        },
      ],
    };
  }, [
    caption,
    formatNumber,
    gridColor,
    incompleteFill,
    incompleteYear,
    items,
    resolvedTheme,
    t,
    textMuted,
    title,
    tooltipBg,
    tooltipBorder,
    tooltipText,
  ]);

  const exportColumns = useMemo(
    () => [
      { key: "year", header: t("Year") },
      { key: "articles", header: t("Articles") },
    ],
    [t],
  );

  const exportRows = useMemo(
    () => items.map((item) => ({ year: item.year, articles: item.articles })),
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
            filename="artigos-por-ano"
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
