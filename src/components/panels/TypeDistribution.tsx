import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "next-i18next";
import type { ECharts, EChartsOption } from "echarts";
import dynamic from "next/dynamic";
import { ChartBar, ChartPie } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import type { PublicationsByTypePoint } from "../../types/PublicationsDashboard";
import ChartExportMenu from "./ChartExportMenu";
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
  totalPublications: _totalPublications,
  loading,
  error,
  height = 380,
}: Props) {
  const { t } = useTranslation("common");
  const { resolvedTheme } = useTheme();
  const [chartKind, setChartKind] = useState<ChartKind>("pie");
  const chartRef = useRef<ECharts | null>(null);

  const handleChartReady = useCallback((chart: ECharts | null) => {
    chartRef.current = chart;
  }, []);

  const exportRows = useMemo(
    () =>
      data.map((item) => ({
        type: item.type,
        count: item.count,
      })),
    [data],
  );

  const exportColumns = useMemo(
    () => [
      { key: "type", header: t("Type") },
      { key: "count", header: t("Publications") },
    ],
    [t],
  );

  const textMuted = resolvedTheme === "dark" ? "#a1a1aa" : "#555555";
  const gridColor = resolvedTheme === "dark" ? "#2f3542" : "#e5e7eb";
  const labelOutside = resolvedTheme === "dark" ? "#e5e7eb" : "#555555";
  const labelInside =
    resolvedTheme === "dark" ? "#e5e7eb" : "#1f2937";
  const tooltipBg =
    resolvedTheme === "dark"
      ? "rgba(17, 24, 39, 0.96)"
      : "rgba(255, 255, 255, 0.98)";
  const tooltipBorder = resolvedTheme === "dark" ? "#374151" : "#e2e8f0";
  const tooltipText = resolvedTheme === "dark" ? "#e5e7eb" : "#0f172a";

  // Responsável por construir a opção do gráfico, de acordo com o tipo de gráfico selecionado
  const option = useMemo<EChartsOption>(() => {
    const common = {
      textStyle: {
        fontFamily: '"rawline", helvetica, arial, sans-serif',
        color: textMuted,
      },
    };
    const bucketsTotal = data.reduce((sum, item) => sum + item.count, 0);

    // Construção do gráfico de pizza (Tipologia documental)
    if (chartKind === "pie") {
      const pieTotal = bucketsTotal > 0 ? bucketsTotal : 1;

      return {
        ...common,
        tooltip: {
          trigger: "item",
          backgroundColor: tooltipBg,
          borderColor: tooltipBorder,
          borderWidth: 1,
          padding: [10, 12],
          extraCssText:
            "border-radius:10px;box-shadow:0 12px 32px rgba(15,23,42,0.28);",
          textStyle: {
            color: tooltipText,
            fontFamily: '"rawline", helvetica, arial, sans-serif',
            fontSize: 13,
          },
          formatter: (params: any) => {
            const name = String(params?.name ?? "");
            const value = Number(params?.value ?? 0);
            const percent = Number(params?.data?.percentOfUnique ?? 0);
            return `${name}: ${value.toLocaleString("pt-BR")} (${percent.toFixed(2)}%)`;
          },
        },
        legend: { show: false },
        series: [
          {
            type: "pie",
            radius: "68%",
            center: ["50%", "52%"],
            padAngle: 0.6,
            avoidLabelOverlap: true,
            itemStyle: {
              borderWidth: 1,
            },
            label: {
              show: true,
              formatter: (params: any) => {
                const name = String(params?.name ?? "");
                const percent = Number(params?.data?.percentOfUnique ?? 0);
                if (percent >= 3) {
                  return `{name|${name}}\n{pct|${percent.toFixed(2)}%}`;
                }
                return `{nameSmall|${name}}\n{pctSmall|${percent.toFixed(2)}%}`;
              },
              rich: {
                name: {
                  fontSize: 12,
                  fontWeight: 600,
                  color: labelInside,
                  lineHeight: 16,
                  align: "center",
                },
                pct: {
                  fontSize: 13,
                  fontWeight: 700,
                  color: labelInside,
                  lineHeight: 18,
                  align: "center",
                },
                nameSmall: {
                  fontSize: 11,
                  fontWeight: 600,
                  color: labelOutside,
                  lineHeight: 15,
                },
                pctSmall: {
                  fontSize: 11,
                  fontWeight: 700,
                  color: labelOutside,
                  lineHeight: 15,
                },
              },
            },
            labelLine: {
              show: true,
              length: 12,
              length2: 10,
              lineStyle: { color: gridColor, width: 1 },
            },
            labelLayout: { hideOverlap: true },
            data: data.map((item) => {
              const style = getPublicationTypeStyle(item.type, resolvedTheme);
              const percent = percentOfTotal(item.count, pieTotal);
              return {
                name: t(item.type),
                value: item.count,
                percentOfUnique: percent,
                label: {
                  position: percent >= 3 ? "inside" : "outside",
                },
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
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        backgroundColor: tooltipBg,
        borderColor: tooltipBorder,
        borderWidth: 1,
        textStyle: { color: tooltipText },
      },
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
              const style = getPublicationTypeStyle(item.type, resolvedTheme);
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
  }, [
    data,
    chartKind,
    textMuted,
    gridColor,
    labelOutside,
    labelInside,
    tooltipBg,
    tooltipBorder,
    tooltipText,
    resolvedTheme,
    t,
  ]);

  return (
    <div className="brcris-chart-card" style={{ height: `500px` }}>
      <div className="brcris-chart-card__header">
        <h2 className="brcris-chart-card__title">
          {t("Document typology")}
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
            filename="publicacoes-por-tipo"
            columns={exportColumns}
            rows={exportRows}
            disabled={loading || error || data.length === 0}
            getImageDataUrl={() =>
              chartRef.current?.getDataURL({
                type: "png",
                pixelRatio: 2,
                backgroundColor: "#ffffff",
              })
            }
          />
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
          <EChart
            option={option}
            height={height}
            onChartReady={handleChartReady}
          />
        ) : null}
      </div>
    </div>
  );
}
