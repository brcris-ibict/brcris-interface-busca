import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "next-i18next";
import type { EChartsOption } from "echarts";
import dynamic from "next/dynamic";
import { ChartBar, ChartPie, Plus } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import type { PublicationsByInstitutionPoint } from "../../types/PublicationsDashboard";
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
  data: PublicationsByInstitutionPoint[];
  totalPublications?: number;
  publicationsWithoutInstitution?: number;
  loading: boolean;
  error: boolean;
  height?: number;
};

const BAR_ROW_HEIGHT = 52;
const PAGE_SIZE = 10;
const LABEL_MAX_CHARS = 32;
const PIE_SLICE_LIMIT = 10;

function shortenLabel(name: string) {
  if (name.length <= LABEL_MAX_CHARS) return name;
  return `${name.slice(0, LABEL_MAX_CHARS - 1)}…`;
}

function buildInstitutionPieSeries(
  data: PublicationsByInstitutionPoint[],
  topInstitutionsLabel: string,
  othersLabel: string,
  withoutInstitutionLabel: string,
  totalPublications?: number,
  publicationsWithoutInstitution = 0,
) {
  const topInstitutionsCount = data
    .slice(0, PIE_SLICE_LIMIT)
    .reduce((sum, item) => sum + item.count, 0);
  const othersInstitutionsCount = data
    .slice(PIE_SLICE_LIMIT)
    .reduce((sum, item) => sum + item.count, 0);

  const series: { name: string; value: number }[] = [];

  if (topInstitutionsCount > 0) {
    series.push({
      name: topInstitutionsLabel,
      value: topInstitutionsCount,
    });
  }

  if (othersInstitutionsCount > 0) {
    series.push({
      name: othersLabel,
      value: othersInstitutionsCount,
    });
  }

  if (publicationsWithoutInstitution > 0) {
    series.push({
      name: withoutInstitutionLabel,
      value: publicationsWithoutInstitution,
    });
  }

  const institutionsTotal = data.reduce((sum, item) => sum + item.count, 0);
  const total = totalPublications ?? institutionsTotal + publicationsWithoutInstitution;

  return { series, total };
}

export default function InstitutionDistribution({
  data,
  totalPublications,
  publicationsWithoutInstitution = 0,
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

  const hasChartData = data.length > 0 || publicationsWithoutInstitution > 0;

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
      const { series: pieSeriesData, total } = buildInstitutionPieSeries(
        data,
        t("Top 10 institutions"),
        t("Others"),
        t("Without linked institution"),
        totalPublications,
        publicationsWithoutInstitution,
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
              formatter: (params) => {
                const item = params as { name?: string; percent?: number };
                return `${shortenLabel(String(item.name ?? ""))}\n${item.percent}%`;
              },
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
            data: pieSeriesData,
          },
        ],
      };
    }

    const fullNames = chartData.map((item) => item.institution).reverse();
    const shortLabels = fullNames.map(shortenLabel);
    const values = chartData.map((item) => item.count).reverse();

    return {
      ...common,
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params) => {
          const items = Array.isArray(params) ? params : [params];
          const item = items[0] as { dataIndex?: number; value?: number };
          const name = fullNames[item.dataIndex ?? 0] ?? "";
          return `${name}<br/>${Number(item.value).toLocaleString("pt-BR")}`;
        },
      },
      legend: { show: false },
      grid: {
        left: 200,
        right: 72,
        top: 12,
        bottom: 12,
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
          fontSize: 12,
          lineHeight: 16,
          margin: 8,
          width: 180,
          overflow: "truncate",
        },
      },
      series: [
        {
          type: "bar",
          data: values,
          barMaxWidth: 44,
          barCategoryGap: "32%",
          itemStyle: { borderRadius: 0 },
          label: {
            show: true,
            position: "right",
            color: textMuted,
            fontSize: 13,
            fontWeight: 500,
            formatter: (params) => Number(params.value).toLocaleString("pt-BR"),
          },
        },
      ],
    };
  }, [
    data,
    visibleData,
    chartKind,
    textMuted,
    gridColor,
    resolvedTheme,
    t,
    totalPublications,
    publicationsWithoutInstitution,
  ]);

  return (
    <div className="brcris-chart-card">
      <div className="brcris-chart-card__header">
        <h2 className="brcris-chart-card__title">
          {t("Publications by institution composition")}
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

        {!loading && !error && hasChartData && chartKind === "bar" ? (
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
