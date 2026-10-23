import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "next-i18next";
import type { ECharts, EChartsOption } from "echarts";
import dynamic from "next/dynamic";
import { ChartBar, ChartPie, Plus, RotateCcw } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import type { PeopleByNationalityPoint } from "../../types/PeopleDashboard";
import ChartExportMenu from "./ChartExportMenu";
import ChartFeedback from "./ChartFeedback";
import {
  PRIMARY_CHART_COLOR,
  chartFillColor,
  MISSING_SLICE_COLOR,
  getSequentialSliceStyle,
} from "./publicationsChartConfig";

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
  data: PeopleByNationalityPoint[];
  totalResearchers?: number;
  researchersWithoutNationality?: number;
  loading: boolean;
  error: boolean;
  height?: number;
};

// Dez barras cabem sem scroll; ao carregar mais, o gráfico ultrapassa a área e rola.
const BAR_ROW_HEIGHT = 36;

const PAGE_SIZE = 13;

// Mesmo recorte do Kibana: as maiores fatias e o restante em "Outras"
const PIE_SLICE_LIMIT = 6;

type NationalityPieSlice = {
  name: string;
  value: number;
  isWithoutNationality?: boolean;
};

function buildNationalityPieSeries(
  data: PeopleByNationalityPoint[],
  othersLabel: string,
  withoutNationalityLabel: string,
  totalResearchers?: number,
  researchersWithoutNationality = 0,
) {
  const othersCount = data
    .slice(PIE_SLICE_LIMIT)
    .reduce((sum, item) => sum + item.count, 0);

  const series: NationalityPieSlice[] = data
    .slice(0, PIE_SLICE_LIMIT)
    .map((item) => ({ name: item.nationality, value: item.count }));

  if (othersCount > 0) {
    series.push({ name: othersLabel, value: othersCount });
  }

  if (researchersWithoutNationality > 0) {
    series.push({
      name: withoutNationalityLabel,
      value: researchersWithoutNationality,
      isWithoutNationality: true,
    });
  }

  const nationalitiesTotal = data.reduce((sum, item) => sum + item.count, 0);
  const total = totalResearchers ?? nationalitiesTotal + researchersWithoutNationality;

  return { series, total };
}

export default function NationalityDistribution({
  data,
  totalResearchers,
  researchersWithoutNationality = 0,
  loading,
  error,
  height = 468,
}: Props) {
  const { t } = useTranslation("common");
  const { resolvedTheme } = useTheme();
  const [chartKind, setChartKind] = useState<ChartKind>("bar");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const chartRef = useRef<ECharts | null>(null);

  const handleChartReady = useCallback((chart: ECharts | null) => {
    chartRef.current = chart;
  }, []);

  const exportRows = useMemo(() => {
    const rows = data.map((item) => ({
      nationality: item.nationality,
      count: item.count,
    }));
    if (researchersWithoutNationality > 0) {
      rows.push({
        nationality: t("Without nationality"),
        count: researchersWithoutNationality,
      });
    }
    return rows;
  }, [data, researchersWithoutNationality, t]);

  const exportColumns = useMemo(
    () => [
      { key: "nationality", header: t("Nationality") },
      { key: "count", header: t("Researchers") },
    ],
    [t],
  );

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [data]);

  const visibleData = useMemo(
    () => data.slice(0, visibleCount),
    [data, visibleCount],
  );

  const hasMore = visibleData.length < data.length;
  const canReset = visibleCount > PAGE_SIZE;

  const handleLoadMore = () => {
    setVisibleCount((current) => Math.min(current + PAGE_SIZE, data.length));
  };

  const handleReset = () => {
    setVisibleCount(PAGE_SIZE);
  };

  const textMuted = resolvedTheme === "dark" ? "#a1a1aa" : "#555555";
  const gridColor = resolvedTheme === "dark" ? "#2f3542" : "#e5e7eb";
  const barChartHeight = visibleData.length * BAR_ROW_HEIGHT;
  const hasChartData = data.length > 0 || researchersWithoutNationality > 0;

  const option = useMemo<EChartsOption>(() => {
    const common = {
      textStyle: {
        fontFamily: '"rawline", helvetica, arial, sans-serif',
        color: textMuted,
      },
    };
    const textMain = resolvedTheme === "dark" ? "#e5e7eb" : "#333333";

    if (chartKind === "pie") {
      const withoutNationalityColor = MISSING_SLICE_COLOR[resolvedTheme];
      const { series: pieSeriesData, total } = buildNationalityPieSeries(
        data,
        t("Others"),
        t("Without nationality"),
        totalResearchers,
        researchersWithoutNationality,
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
              text: t("researchers"),
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
            padAngle: 1,
            avoidLabelOverlap: true,
            itemStyle: {
              borderWidth: 1,
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
            data: pieSeriesData.map((item, index) => {
              if (item.isWithoutNationality) {
                return {
                  name: item.name,
                  value: item.value,
                  itemStyle: {
                    color: withoutNationalityColor,
                    borderColor: withoutNationalityColor,
                    borderWidth: 1,
                  },
                };
              }
              return {
                name: item.name,
                value: item.value,
                itemStyle: getSequentialSliceStyle(index, pieSeriesData.length, resolvedTheme),
              };
            }),
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
        data: visibleData.map((item) => item.nationality).reverse(),
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
          data: visibleData.map((item) => item.count).reverse(),
          barMaxWidth: 30,
          barCategoryGap: "32%",
          itemStyle: {
            color: chartFillColor(PRIMARY_CHART_COLOR, resolvedTheme),
            borderColor: PRIMARY_CHART_COLOR,
            borderWidth: 1,
            borderRadius: 0,
          },
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
  }, [visibleData, data, chartKind, textMuted, gridColor, resolvedTheme, t, totalResearchers, researchersWithoutNationality]);

  return (
    <div className="brcris-chart-card" style={{ height: `100%` }}>
      <div className="brcris-chart-card__header">
        <h2 className="brcris-chart-card__title">
          {t("Researchers by nationality")}
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
          <ChartExportMenu
            filename="pesquisadores-por-nacionalidade"
            columns={exportColumns}
            rows={exportRows}
            disabled={loading || error || !hasChartData}
            getChart={() => chartRef.current}
            imageTitle={t("Researchers by nationality")}
          />
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
          <div
            className={
              chartKind === "bar" ? "brcris-chart-card__scroll" : undefined
            }
            style={
              chartKind === "bar" ? { maxHeight: height } : undefined
            }
          >
            <EChart
              key={chartKind === "bar" ? `bar-${visibleCount}` : "pie"}
              option={option}
              height={chartKind === "bar" ? barChartHeight : height}
              onChartReady={handleChartReady}
            />
          </div>
        ) : null}

        {!loading && !error && data.length > 0 && chartKind === "bar" ? (
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
                total: data.length,
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
