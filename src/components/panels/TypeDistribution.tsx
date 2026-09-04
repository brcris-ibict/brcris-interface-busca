import { useMemo, useState } from "react";
import { useTranslation } from "next-i18next";
import type { EChartsOption } from "echarts";
import dynamic from "next/dynamic";
import { ChartBar, ChartPie } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import type { PublicationsByTypePoint } from "../../types/PublicationsDashboard";
import ChartFeedback from "./ChartFeedback";
import { getPublicationTypeStyle } from "./publicationsChartConfig";

const EChart = dynamic(() => import("./EChart"), { ssr: false });

// Tipos de gráficos disponíveis
type ChartKind = "pie" | "bar";

// Botões de seleção de tipo de gráfico
const TOGGLES: {
  kind: ChartKind;
  Icon: typeof ChartPie;
  labelKey: string;
}[] = [
  { kind: "pie", Icon: ChartPie, labelKey: "Chart pie" },
  { kind: "bar", Icon: ChartBar, labelKey: "Chart horizontal bars" },
];

// Props do componente
type Props = {
  data: PublicationsByTypePoint[];
  totalPublications?: number;
  loading: boolean;
  error: boolean;
  height?: number;
};

// Função responsável por calcular o percentual de uma quantidade em relação a um total
function percentOfTotal(count: number, total: number) {
  if (total <= 0) return 0;
  return Number(((count / total) * 100).toFixed(2));
}

export default function TypeDistribution({
  data,
  totalPublications,
  loading,
  error,
  height = 380,
}: Props) {
  const { t } = useTranslation("common");
  const { resolvedTheme } = useTheme();
  const [chartKind, setChartKind] = useState<ChartKind>("pie");

  const textMuted = resolvedTheme === "dark" ? "#a1a1aa" : "#555555";
  const gridColor = resolvedTheme === "dark" ? "#2f3542" : "#e5e7eb";

  // Responsável por construir a opção do gráfico, de acordo com o tipo de gráfico selecionado
  const option = useMemo<EChartsOption>(() => {
    const common = {
      textStyle: {
        fontFamily: '"rawline", helvetica, arial, sans-serif',
        color: textMuted,
      },
    };
    const bucketsTotal = data.reduce((sum, item) => sum + item.count, 0);
    const total = totalPublications ?? bucketsTotal;
    const textMain = resolvedTheme === "dark" ? "#e5e7eb" : "#333333";

    // Construção do gráfico de pizza
    if (chartKind === "pie") {
      return {
        ...common,
        tooltip: {
          trigger: "item",
          formatter: (params) => {
            const item = params as {
              name?: string;
              value?: number;
              data?: { percentOfUnique?: number };
            };
            const percent = item.data?.percentOfUnique ?? 0;
            return `${item.name}: ${Number(item.value).toLocaleString("pt-BR")} (${percent}%)`;
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
            padAngle: 1,
            avoidLabelOverlap: true,
            itemStyle: {
              borderWidth: 1,
            },
            label: {
              show: true,
              formatter: (params) => {
                const item = params as {
                  name?: string;
                  data?: { percentOfUnique?: number };
                };
                const percent = item.data?.percentOfUnique ?? 0;
                return `${item.name}\n${percent}%`;
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
            data: data.map((item) => {
              const style = getPublicationTypeStyle(item.type);
              return {
                name: t(item.type),
                value: item.count,
                percentOfUnique: percentOfTotal(item.count, total),
                itemStyle: {
                  color: style.color,
                  borderColor: style.borderColor,
                  borderWidth: 1,
                },
              };
            }),
          },
        ],
      };
    }

    // Construção do gráfico de barras
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
          data: data
            .map((item) => {
              const style = getPublicationTypeStyle(item.type);
              return {
                value: item.count,
                itemStyle: {
                  color: style.color,
                  borderColor: style.borderColor,
                  borderWidth: 1,
                  borderRadius: 0,
                },
              };
            })
            .reverse(),
          barMaxWidth: 32,
          barCategoryGap: "22%",
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
  }, [data, chartKind, textMuted, gridColor, resolvedTheme, t, totalPublications]);

  return (
    <div className="brcris-chart-card" style={{ height: `500px` }}>
      <div className="brcris-chart-card__header">
        <h2 className="brcris-chart-card__title">
          {t("Publications by type composition")}
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

        {!loading && !error && data.length > 0 ? (
          <div className="brcris-chart-card__footer">
            <span className="brcris-chart-card__meta">
              {t("A publication may have more than one type")}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
