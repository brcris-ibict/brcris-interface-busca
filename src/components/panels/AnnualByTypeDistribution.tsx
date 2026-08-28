import { useMemo, useState } from "react";
import { useTranslation } from "next-i18next";
import type { EChartsOption } from "echarts";
import dynamic from "next/dynamic";
import { BarChart3, ChartArea, LineChart } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import type { PublicationsAnnualByTypePoint } from "../../types/PublicationsDashboard";
import ChartFeedback from "./ChartFeedback";
import { PANEL_CHART_COLORS } from "./publicationsChartConfig";

const EChart = dynamic(() => import("./EChart"), { ssr: false });

type ChartKind = "bar" | "line" | "area";

const TOGGLES: {
  kind: ChartKind;
  Icon: typeof BarChart3;
  labelKey: string;
}[] = [
  { kind: "bar", Icon: BarChart3, labelKey: "Chart bars" },
  { kind: "line", Icon: LineChart, labelKey: "Chart lines" },
  { kind: "area", Icon: ChartArea, labelKey: "Chart area" },
];

type Props = {
  data: PublicationsAnnualByTypePoint[];
  loading: boolean;
  error: boolean;
  height?: number;
};

export default function AnnualByTypeDistribution({
  data,
  loading,
  error,
  height = 320,
}: Props) {
  const { t } = useTranslation("common");
  const { resolvedTheme } = useTheme();
  const [chartKind, setChartKind] = useState<ChartKind>("bar");

  const textMuted = resolvedTheme === "dark" ? "#a1a1aa" : "#555555";
  const gridColor = resolvedTheme === "dark" ? "#2f3542" : "#e5e7eb";
  const seriesType = chartKind === "area" ? "line" : chartKind;

  const years = useMemo(() => data.map((point) => point.year), [data]);

  const typeNames = useMemo(() => {
    const names = new Set<string>();

    data.forEach((point) => {
      point.types.forEach((item) => names.add(item.type));
    });

    return Array.from(names);
    
  }, [data]);

  const option = useMemo<EChartsOption>(() => {
    const countByYearAndType = new Map<string, number>();

    data.forEach((point) => {
      point.types.forEach((item) => {
        countByYearAndType.set(`${point.year}::${item.type}`, item.count);
      });
    });

    return {
      color: PANEL_CHART_COLORS,
      textStyle: {
        fontFamily: '"rawline", helvetica, arial, sans-serif',
        color: textMuted,
      },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: chartKind === "bar" ? "shadow" : "line" },
      },
      legend: {
        type: "scroll",
        bottom: 0,
        itemWidth: 10,
        itemHeight: 10,
        itemGap: 8,
        textStyle: { color: textMuted, fontSize: 10 },
      },
      grid: {
        left: 16,
        right: 16,
        top: 16,
        bottom: 48,
        containLabel: true,
      },
      xAxis: {
        type: "category",
        data: years,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: textMuted, fontSize: 11 },
      },
      yAxis: {
        type: "value",
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: textMuted, fontSize: 12 },
        splitLine: {
          lineStyle: { color: gridColor, type: "solid", width: 1 },
        },
      },
      series: typeNames.map((typeName) => ({
        name: typeName,
        type: seriesType,
        stack: "annualByType",
        emphasis: { focus: "series" },
        data: years.map(
          (year) => countByYearAndType.get(`${year}::${typeName}`) ?? 0,
        ),
        ...(chartKind === "bar"
          ? { barMaxWidth: 36 }
          : {
              smooth: false,
              symbol: "circle",
              symbolSize: 4,
              lineStyle: { width: 2 },
              ...(chartKind === "area"
                ? { areaStyle: { opacity: 0.35 } }
                : {}),
            }),
      })),
    };
  }, [data, years, typeNames, chartKind, seriesType, textMuted, gridColor]);

  const empty = !loading && !error && (data.length === 0 || typeNames.length === 0);

  return (
    <div className="brcris-chart-card">
      <div className="brcris-chart-card__header">
        <h2 className="brcris-chart-card__title">
          {t("Annual distribution by type")}
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
          empty={empty}
        />
        {!loading && !error && !empty ? (
          <EChart option={option} height={height} />
        ) : null}
      </div>
    </div>
  );
}
