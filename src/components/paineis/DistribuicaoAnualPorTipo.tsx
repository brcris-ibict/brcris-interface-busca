import { useMemo, useState } from "react";
import { useTranslation } from "next-i18next";
import type { EChartsOption } from "echarts";
import dynamic from "next/dynamic";
import { BarChart3, ChartArea, LineChart } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import {
  PAINEL_CHART_COLORS,
  anos,
  seriesAnual,
} from "./mocks/publicacoesCharts";

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
  height?: number;
};

export default function DistribuicaoAnualPorTipo({ height = 360 }: Props) {
  const { t } = useTranslation("common");
  const { resolvedTheme } = useTheme();
  const [tipo, setTipo] = useState<ChartKind>("bar");

  const textMuted = resolvedTheme === "dark" ? "#a1a1aa" : "#555555";
  const gridColor = resolvedTheme === "dark" ? "#2f3542" : "#e5e7eb";
  const serieType = tipo === "area" ? "line" : tipo;

  const option = useMemo<EChartsOption>(
    () => ({
      color: PAINEL_CHART_COLORS,
      textStyle: {
        fontFamily: '"rawline", helvetica, arial, sans-serif',
        color: textMuted,
      },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: tipo === "bar" ? "shadow" : "line" },
      },
      legend: {
        bottom: 0,
        type: "scroll",
        icon: "roundRect",
        itemWidth: 12,
        itemHeight: 8,
        textStyle: { color: textMuted, fontSize: 12 },
      },
      grid: {
        left: 16,
        right: 16,
        top: 16,
        bottom: 56,
        containLabel: true,
      },
      xAxis: {
        type: "category",
        data: anos,
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
      series: seriesAnual.map((serie) => ({
        name: serie.name,
        type: serieType,
        data: serie.data,
        barMaxWidth: 26,
        barGap: "5%",
        barCategoryGap: "20%",
        itemStyle: { borderRadius: 0 },
        ...(tipo === "line" || tipo === "area"
          ? {
              smooth: false,
              symbol: "circle",
              symbolSize: 6,
              ...(tipo === "area" ? { areaStyle: { opacity: 0.35 } } : {}),
            }
          : {}),
      })),
    }),
    [tipo, serieType, textMuted, gridColor],
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
              className={tipo === kind ? "is-active" : undefined}
              title={t(labelKey)}
              aria-label={t(labelKey)}
              aria-pressed={tipo === kind}
              onClick={() => setTipo(kind)}
            >
              <Icon size={18} />
            </button>
          ))}
        </div>
      </div>

      <div className="brcris-chart-card__body">
        <EChart option={option} height={height} />
      </div>
    </div>
  );
}
