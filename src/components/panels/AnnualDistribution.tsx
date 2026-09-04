import { useMemo, useState } from "react";
import { useTranslation } from "next-i18next";
import type { EChartsOption } from "echarts";
import dynamic from "next/dynamic";
import { BarChart3, ChartArea, LineChart } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import type { PublicationsByYearPoint } from "../../types/PublicationsDashboard";
import ChartFeedback from "./ChartFeedback";
import { PRIMARY_CHART_COLOR, hexToRgba } from "./publicationsChartConfig";

const EChart = dynamic(() => import("./EChart"), { ssr: false });

// Tipos de gráficos disponíveis
type ChartKind = "bar" | "line" | "area";

// Botões de seleção de tipo de gráfico
const TOGGLES: {
  kind: ChartKind;
  Icon: typeof BarChart3;
  labelKey: string;
}[] = [
  { kind: "bar", Icon: BarChart3, labelKey: "Chart bars" },
  { kind: "line", Icon: LineChart, labelKey: "Chart lines" },
  { kind: "area", Icon: ChartArea, labelKey: "Chart area" },
];

// Props do componente
type Props = {
  data: PublicationsByYearPoint[];
  loading: boolean;
  error: boolean;
  height?: number;
};

export default function AnnualDistribution({
  data,
  loading,
  error,
  height = 360,
}: Props) {
  const { t } = useTranslation("common");
  const { resolvedTheme } = useTheme();
  const [chartKind, setChartKind] = useState<ChartKind>("bar");

  const textMuted = resolvedTheme === "dark" ? "#a1a1aa" : "#555555";
  const gridColor = resolvedTheme === "dark" ? "#2f3542" : "#e5e7eb";
  const seriesType = chartKind === "area" ? "line" : chartKind;

  // Responsável por construir a opção do gráfico, de acordo com o tipo de gráfico selecionado
  const option = useMemo<EChartsOption>(
    () => ({
      color: [PRIMARY_CHART_COLOR],
      textStyle: {
        fontFamily: '"rawline", helvetica, arial, sans-serif',
        color: textMuted,
      },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: chartKind === "bar" ? "shadow" : "line" },
      },
      legend: { show: false },
      grid: {
        left: 16,
        right: 16,
        top: 16,
        bottom: 24,
        containLabel: true,
      },
      xAxis: {
        type: "category",
        data: data.map((point) => point.year),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: textMuted, fontSize: 12 },
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
      series: [
        {
          name: t("Publications"),
          type: seriesType,
          data: data.map((point) => point.count),
          barMaxWidth: 48,
          barCategoryGap: "28%",
          itemStyle: {
            color: hexToRgba(PRIMARY_CHART_COLOR, 0.2),
            borderColor: PRIMARY_CHART_COLOR,
            borderWidth: 1,
            borderRadius: 0,
          },
          ...(chartKind === "line" || chartKind === "area"
            ? {
                smooth: false,
                symbol: "circle",
                symbolSize: 6,
                lineStyle: { color: PRIMARY_CHART_COLOR, width: 2 },
                ...(chartKind === "area"
                  ? {
                      areaStyle: {
                        color: hexToRgba(PRIMARY_CHART_COLOR, 0.28),
                      },
                    }
                  : {}),
              }
            : {}),
        },
      ],
    }),
    [data, chartKind, seriesType, textMuted, gridColor, t],
  );

  return (
    <div className="brcris-chart-card">
      <div className="brcris-chart-card__header">
        <h2 className="brcris-chart-card__title">
          {t("Annual publications by type")}
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
          empty={data.length === 0}
        />
        {!loading && !error && data.length > 0 ? (
          <EChart option={option} height={height} />
        ) : null}
      </div>
    </div>
  );
}
