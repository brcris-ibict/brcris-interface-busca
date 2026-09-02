import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "next-i18next";
import type { EChartsOption } from "echarts";
import dynamic from "next/dynamic";
import { ChartBar, ChartPie, Plus } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import type { PublicationsByLanguagePoint } from "../../types/PublicationsDashboard";
import ChartFeedback from "./ChartFeedback";
import { PANEL_CHART_COLORS } from "./publicationsChartConfig";

const EChart = dynamic(() => import("./EChart"), { ssr: false });

type ChartKind = "pie" | "bar";

const TOGGLES: {
  kind: ChartKind;
  Icon: typeof ChartPie;
  labelKey: string;
}[] = [
  { kind: "pie", Icon: ChartPie, labelKey: "Chart pie" },
  { kind: "bar", Icon: ChartBar, labelKey: "Chart horizontal bars" },
];

type Props = {
  data: PublicationsByLanguagePoint[];
  totalPublications?: number;
  publicationsWithoutLanguage?: number;
  loading: boolean;
  error: boolean;
  height?: number;
};

const BAR_ROW_HEIGHT = 52;
const PAGE_SIZE = 10;
const PIE_SLICE_LIMIT = 10;

type LanguagePieSlice = {
  name: string;
  value: number;
  isWithoutLanguage?: boolean;
};

function buildLanguagePieSeries(
  data: PublicationsByLanguagePoint[],
  translateLanguage: (key: string) => string,
  othersLabel: string,
  withoutLanguageLabel: string,
  totalPublications?: number,
  publicationsWithoutLanguage = 0,
) {
  const topLanguages = data.slice(0, PIE_SLICE_LIMIT);
  const othersCount = data
    .slice(PIE_SLICE_LIMIT)
    .reduce((sum, item) => sum + item.count, 0);

  const series: LanguagePieSlice[] = topLanguages.map((item) => ({
    name: translateLanguage(item.language),
    value: item.count,
  }));

  if (othersCount > 0) {
    series.push({ name: othersLabel, value: othersCount });
  }

  if (publicationsWithoutLanguage > 0) {
    series.push({
      name: withoutLanguageLabel,
      value: publicationsWithoutLanguage,
      isWithoutLanguage: true,
    });
  }

  const languagesTotal = data.reduce((sum, item) => sum + item.count, 0);
  const total = totalPublications ?? languagesTotal + publicationsWithoutLanguage;

  return { series, total };
}

export default function LanguageDistribution({
  data,
  totalPublications,
  publicationsWithoutLanguage = 0,
  loading,
  error,
  height = 380,
}: Props) {
  const { t } = useTranslation("common");
  const { resolvedTheme } = useTheme();
  const [chartKind, setChartKind] = useState<ChartKind>("bar");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [data]);

  const visibleData = useMemo(
    () => data.slice(0, visibleCount),
    [data, visibleCount],
  );

  const hasMore = visibleData.length < data.length;

  const handleLoadMore = () => {
    setVisibleCount((current) => Math.min(current + PAGE_SIZE, data.length));
  };

  const textMuted = resolvedTheme === "dark" ? "#a1a1aa" : "#555555";
  const gridColor = resolvedTheme === "dark" ? "#2f3542" : "#e5e7eb";
  const barChartHeight = visibleData.length * BAR_ROW_HEIGHT;
  const hasChartData = data.length > 0 || publicationsWithoutLanguage > 0;

  const option = useMemo<EChartsOption>(() => {
    const common = {
      color: PANEL_CHART_COLORS,
      textStyle: {
        fontFamily: '"rawline", helvetica, arial, sans-serif',
        color: textMuted,
      },
    };
    const chartData = visibleData;
    const textMain = resolvedTheme === "dark" ? "#e5e7eb" : "#333333";
    const cardBg = resolvedTheme === "dark" ? "#171b22" : "#fefefe";

    if (chartKind === "pie") {
      const withoutLanguageLabel = t("Without linked language");
      const withoutLanguageColor = resolvedTheme === "dark" ? "#6b7280" : "#9ca3af";
      const { series: pieSeriesData, total } = buildLanguagePieSeries(
        data,
        (language) => t(language),
        t("Others"),
        withoutLanguageLabel,
        totalPublications,
        publicationsWithoutLanguage,
      );

      return {
        ...common,
        tooltip: {
          trigger: "item",
          formatter: (params) => {
            const item = params as {
              name?: string;
              value?: number;
              percent?: number;
            };
            return `${item.name}: ${Number(item.value).toLocaleString("pt-BR")} (${item.percent}%)`;
          },
        },
        legend: { show: false },
        graphic: [
          {
            type: "text",
            left: "center",
            top: "42%",
            style: {
              text: total.toLocaleString("pt-BR"),
              fill: textMain,
              fontSize: 22,
              fontWeight: 600,
              fontFamily: '"rawline", helvetica, arial, sans-serif',
              textAlign: "center",
            },
          },
          {
            type: "text",
            left: "center",
            top: "51%",
            style: {
              text: t("publications"),
              fill: textMuted,
              fontSize: 12,
              fontFamily: '"rawline", helvetica, arial, sans-serif',
              textAlign: "center",
            },
          },
        ],
        series: [
          {
            type: "pie",
            radius: ["48%", "68%"],
            center: ["50%", "50%"],
            padAngle: 2,
            avoidLabelOverlap: true,
            itemStyle: {
              borderColor: cardBg,
              borderWidth: 3,
            },
            label: {
              show: true,
              formatter: "{b}\n{d}%",
              color: textMuted,
              fontSize: 11,
              lineHeight: 16,
            },
            labelLine: {
              show: true,
              length: 10,
              length2: 8,
              lineStyle: { color: gridColor, width: 1 },
            },
            data: pieSeriesData.map((item) => ({
              name: item.name,
              value: item.value,
              itemStyle: item.isWithoutLanguage
                ? { color: withoutLanguageColor }
                : undefined,
            })),
          },
        ],
      };
    }

    return {
      ...common,
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
      legend: { show: false },
      grid: {
        left: 12,
        right: 72,
        top: 12,
        bottom: 12,
        containLabel: true,
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
        data: chartData.map((item) => t(item.language)).reverse(),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: textMuted,
          fontSize: 14,
          lineHeight: 20,
          margin: 12,
        },
      },
      series: [
        {
          type: "bar",
          data: chartData.map((item) => item.count).reverse(),
          barMaxWidth: 44,
          barCategoryGap: "32%",
          itemStyle: { borderRadius: 0 },
          label: {
            show: true,
            position: "right",
            color: textMuted,
            fontSize: 14,
            fontWeight: 500,
            formatter: (params) => Number(params.value).toLocaleString("pt-BR"),
          },
        },
      ],
    };
  }, [
    visibleData,
    data,
    chartKind,
    textMuted,
    gridColor,
    resolvedTheme,
    t,
    totalPublications,
    publicationsWithoutLanguage,
  ]);

  return (
    <div className="brcris-chart-card">
      <div className="brcris-chart-card__header">
        <h2 className="brcris-chart-card__title">
          {t("Publications by language composition")}
        </h2>

        <div className="brcris-chart-card__toggles" role="group">
          {TOGGLES.map(({ kind, Icon, labelKey }) => (
            <button
              key={kind}
              type="button"
              className={chartKind === kind ? "is-active" : undefined}
              title={t(labelKey)}
              aria-label={t(labelKey)}
              aria-pressed={chartKind === kind}
              onClick={() => setChartKind(kind)}
            >
              <Icon size={18} />
            </button>
          ))}
        </div>
      </div>

      <div className="brcris-chart-card__body" aria-busy={loading}>
        <ChartFeedback
          height={height}
          loading={loading}
          error={error}
          empty={!hasChartData}
        />
        {!loading && !error && hasChartData ? (
          chartKind === "bar" ? (
            <div
              className="brcris-chart-card__scroll"
              style={{ maxHeight: height }}
            >
              <EChart option={option} height={barChartHeight} />
            </div>
          ) : (
            <EChart option={option} height={height} />
          )
        ) : null}

        {!loading && !error && data.length > 0 && chartKind === "bar" ? (
          <div className="brcris-chart-card__footer">
            <span className="brcris-chart-card__meta">
              {t("Showing chart items of total", {
                visible: visibleData.length,
                total: data.length,
              })}
            </span>

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
        ) : null}
      </div>
    </div>
  );
}
