import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "next-i18next";
import type { ECharts, EChartsOption } from "echarts";
import dynamic from "next/dynamic";
import { Plus, RotateCcw } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import useRequest from "../../hooks/useRequest";
import { withBasePath } from "../../lib/basePath";
import type { ThesisCoursePoint, ThesisCoursesResponse } from "../../types/ThesesDashboard";
import ChartExportMenu from "./ChartExportMenu";
import ChartFeedback from "./ChartFeedback";
import {
  PANEL_CHART_BORDERS,
  PRIMARY_CHART_COLOR,
  chartFillColor,
} from "./publicationsChartConfig";

const EChart = dynamic(() => import("./EChart"), { ssr: false });

const PAGE_SIZE = 11;
const BAR_ROW_HEIGHT = 36;
const LABEL_MAX_CHARS = 44;
const VIEWPORT_HEIGHT = 460;

type Props = {
  height?: number;
};

function formatCourseLabel(item: Pick<ThesisCoursePoint, "name" | "degree">) {
  if (!item.degree) return item.name;
  return `${item.name} (${item.degree})`;
}

function shortenLabel(name: string) {
  if (name.length <= LABEL_MAX_CHARS) return name;
  return `${name.slice(0, LABEL_MAX_CHARS - 1)}…`;
}

export default function ThesesCoursesChart({ height = VIEWPORT_HEIGHT }: Props) {
  const { t, i18n } = useTranslation("common");
  const { resolvedTheme } = useTheme();
  const { data, loading, error, get } = useRequest<ThesisCoursesResponse>();
  const chartRef = useRef<ECharts | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    get(withBasePath("/api/dashboard/theses-courses"));
  }, [get]);

  const handleChartReady = useCallback((chart: ECharts | null) => {
    chartRef.current = chart;
  }, []);

  const locale = i18n.language || "pt-BR";
  const items = useMemo(() => data?.items ?? [], [data]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [items]);

  const visibleData = useMemo(
    () => items.slice(0, visibleCount),
    [items, visibleCount],
  );
  const hasMore = visibleData.length < items.length;
  const canReset = visibleCount > PAGE_SIZE;

  const handleLoadMore = () => {
    setVisibleCount((current) => Math.min(current + PAGE_SIZE, items.length));
  };

  const handleReset = () => {
    setVisibleCount(PAGE_SIZE);
  };

  const isReady = !loading && !error && items.length > 0;

  const textMuted = resolvedTheme === "dark" ? "#a1a1aa" : "#555555";
  const tooltipBg = resolvedTheme === "dark" ? "rgba(17, 24, 39, 0.96)" : "rgba(255, 255, 255, 0.98)";
  const tooltipBorder = resolvedTheme === "dark" ? "#374151" : "#e2e8f0";
  const tooltipText = resolvedTheme === "dark" ? "#e5e7eb" : "#0f172a";

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

  const caption = t("Theses courses caption", {
    withCourse: formatNumber(data?.withCourse ?? 0),
    total: formatNumber(data?.total ?? 0),
    share:
      data && data.total > 0
        ? formatPercent((data.withCourse / data.total) * 100)
        : "—",
  });

  const ranked = useMemo(() => [...visibleData].reverse(), [visibleData]);
  const barChartHeight = Math.max(visibleData.length * BAR_ROW_HEIGHT, BAR_ROW_HEIGHT);

  const option = useMemo<EChartsOption>(() => {
    const fullNames = ranked.map((item) => formatCourseLabel(item));
    const shortLabels = fullNames.map(shortenLabel);

    return {
      aria: {
        enabled: true,
        label: { description: `${t("Theses courses ranking")}. ${caption}` },
      },
      color: [dissertationBorder, thesisBorder],
      textStyle: {
        fontFamily: '"rawline", helvetica, arial, sans-serif',
        color: textMuted,
      },
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
          const index = list[0]?.dataIndex ?? -1;
          const item = ranked[index];
          if (!item) return "";
          const total = item.dissertations + item.theses;
          return [
            `<strong>${formatCourseLabel(item)}</strong>`,
            t("Theses courses tooltip", {
              total: formatNumber(total),
              dissertations: formatNumber(item.dissertations),
              theses: formatNumber(item.theses),
            }),
          ].join("<br/>");
        },
      },
      grid: {
        left: 300,
        right: 72,
        top: 12,
        bottom: 40,
        containLabel: false,
      },
      xAxis: {
        type: "value",
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { show: false },
        splitLine: { show: false },
      },
      yAxis: {
        type: "category",
        data: shortLabels,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: textMuted,
          fontSize: 13,
          lineHeight: 18,
          margin: 8,
          width: 280,
          overflow: "truncate",
        },
      },
      series: [
        {
          name: dissertationsLabel,
          type: "bar",
          stack: "course",
          barMaxWidth: 30,
          barCategoryGap: "32%",
          itemStyle: {
            color: chartFillColor(dissertationBorder, resolvedTheme),
            borderColor: dissertationBorder,
            borderWidth: 1,
            borderRadius: 0,
          },
          data: ranked.map((item) => item.dissertations),
        },
        {
          name: thesesLabel,
          type: "bar",
          stack: "course",
          barMaxWidth: 30,
          itemStyle: {
            color: chartFillColor(thesisBorder, resolvedTheme),
            borderColor: thesisBorder,
            borderWidth: 1,
            borderRadius: 0,
          },
          label: {
            show: true,
            position: "right",
            color: textMuted,
            fontSize: 13,
            fontWeight: 500,
            formatter: (params) => {
              const item = ranked[params.dataIndex ?? -1];
              if (!item) return "";
              return formatNumber(item.dissertations + item.theses);
            },
          },
          data: ranked.map((item) => item.theses),
        },
      ],
    };
  }, [
    caption,
    dissertationBorder,
    dissertationsLabel,
    formatNumber,
    ranked,
    resolvedTheme,
    t,
    textMuted,
    thesesLabel,
    thesisBorder,
    tooltipBg,
    tooltipBorder,
    tooltipText,
  ]);

  const exportColumns = useMemo(
    () => [
      { key: "name", header: t("Course") },
      { key: "degree", header: t("Degree") },
      { key: "dissertations", header: dissertationsLabel },
      { key: "theses", header: thesesLabel },
      { key: "total", header: t("Total") },
    ],
    [dissertationsLabel, t, thesesLabel],
  );

  const exportRows = useMemo(
    () =>
      items.map((item) => ({
        name: item.name,
        degree: item.degree ?? "",
        dissertations: item.dissertations,
        theses: item.theses,
        total: item.dissertations + item.theses,
      })),
    [items],
  );

  return (
    <div className="brcris-chart-card h-100" style={{ minHeight: 580 }}>
      <div className="brcris-chart-card__header">
        <div className="brcris-knowledge-areas__heading">
          <h2 className="brcris-chart-card__title">{t("Theses courses ranking")}</h2>
          <p className="brcris-knowledge-areas__caption">{caption}</p>
        </div>
        <div className="brcris-chart-card__toggles" role="group">
          <ChartExportMenu
            filename="cursos-de-titulacao"
            columns={exportColumns}
            rows={exportRows}
            getChart={() => chartRef.current}
            imageTitle={t("Theses courses ranking")}
            disabled={!isReady}
          />
        </div>
      </div>
      <div className="brcris-chart-card__body" aria-busy={loading}>
        <ChartFeedback
          height={height}
          loading={loading}
          error={Boolean(error)}
          empty={items.length === 0}
        />
        {isReady ? (
          <div className="brcris-chart-card__scroll" style={{ maxHeight: height }}>
            <EChart
              key={`bar-${visibleCount}`}
              option={option}
              height={barChartHeight + 40}
              onChartReady={handleChartReady}
            />
          </div>
        ) : null}

        {isReady ? (
          <div className="brcris-chart-card__footer">
            {canReset ? (
              <button
                type="button"
                className="brcris-chart-card__load-more brcris-chart-card__footer-reset"
                title={t("Reset chart items")}
                aria-label={t("Reset chart items")}
                onClick={handleReset}
              >
                <RotateCcw size={18} />
              </button>
            ) : null}

            <span className="brcris-chart-card__meta">
              {t("Showing chart items of total", {
                visible: visibleData.length,
                total: items.length,
              })}
            </span>

            <div className="brcris-chart-card__pager">
              {hasMore ? (
                <button
                  type="button"
                  className="brcris-chart-card__load-more"
                  title={t("Load more chart items")}
                  aria-label={t("Load more chart items")}
                  onClick={handleLoadMore}
                >
                  <Plus size={18} />
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
