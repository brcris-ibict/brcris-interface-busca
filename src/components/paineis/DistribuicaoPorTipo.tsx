import { useMemo, useState } from "react";
import { useTranslation } from "next-i18next";
import type { EChartsOption } from "echarts";
import dynamic from "next/dynamic";
import { ChartBar, ChartPie } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import type { PublicationsByTypePoint } from "../../types/PublicationsDashboard";
import ChartFeedback from "./ChartFeedback";
import { PAINEL_CHART_COLORS } from "./publicacoesChartConfig";

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
  data: PublicationsByTypePoint[];
  loading: boolean;
  error: boolean;
  height?: number;
};

export default function DistribuicaoPorTipo({
  data,
  loading,
  error,
  height = 380,
}: Props) {
  const { t } = useTranslation("common");
  const { resolvedTheme } = useTheme();
  const [tipo, setTipo] = useState<ChartKind>("pie");

  const textMuted = resolvedTheme === "dark" ? "#a1a1aa" : "#555555";
  const gridColor = resolvedTheme === "dark" ? "#2f3542" : "#e5e7eb";

  const option = useMemo<EChartsOption>(() => {
    const common = {
      color: PAINEL_CHART_COLORS,
      textStyle: {
        fontFamily: '"rawline", helvetica, arial, sans-serif',
        color: textMuted,
      },
    };
    const total = data.reduce((sum, item) => sum + item.count, 0);
    const textMain = resolvedTheme === "dark" ? "#e5e7eb" : "#333333";
    const cardBg = resolvedTheme === "dark" ? "#171b22" : "#fefefe";

    if (tipo === "pie") {
      return {
        ...common,
        tooltip: {
          trigger: "item",
          formatter: "{b}: {c} ({d}%)",
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
            data: data.map((item) => ({
              name: t(item.type),
              value: item.count,
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
        left: 8,
        right: 48,
        top: 8,
        bottom: 8,
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
        data: data.map((item) => t(item.type)).reverse(),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: textMuted, fontSize: 11 },
      },
      series: [
        {
          type: "bar",
          data: data.map((item) => item.count).reverse(),
          barMaxWidth: 32,
          barCategoryGap: "22%",
          itemStyle: { borderRadius: 0 },
          label: {
            show: true,
            position: "right",
            color: textMuted,
            fontSize: 11,
            formatter: (params) => Number(params.value).toLocaleString("pt-BR"),
          },
        },
      ],
    };
  }, [data, tipo, textMuted, gridColor, resolvedTheme, t]);

  return (
    <div className="brcris-chart-card">
      <div className="brcris-chart-card__header">
        <h2 className="brcris-chart-card__title">
          {t("Publications by type composition")}
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
