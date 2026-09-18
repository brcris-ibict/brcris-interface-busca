import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "next-i18next";
import type { ECharts, EChartsOption } from "echarts";
import dynamic from "next/dynamic";
import { BarChart3, ChartArea, LineChart } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import type { PublicationsAnnualByTypePoint } from "../../types/PublicationsDashboard";
import ChartExportMenu from "./ChartExportMenu";
import ChartFeedback from "./ChartFeedback";
import { getPublicationTypeStyle } from "./publicationsChartConfig";

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
  const chartRef = useRef<ECharts | null>(null);

  const handleChartReady = useCallback((chart: ECharts | null) => {
    chartRef.current = chart;
  }, []);

  const textMuted = resolvedTheme === "dark" ? "#a1a1aa" : "#555555";
  const gridColor = resolvedTheme === "dark" ? "#2f3542" : "#e5e7eb";
  const seriesType = chartKind === "area" ? "line" : chartKind;

  const years = useMemo(() => data.map((point) => point.year), [data]);

  // Retorna os tipos de publicação únicos
  const typeNames = useMemo(() => {
    const names = new Set<string>();

    data.forEach((point) => {
      point.types.forEach((item) => names.add(item.type));
    });

    return Array.from(names);
  }, [data]);

  const exportRows = useMemo(
    () =>
      data.flatMap((point) =>
        point.types.map((item) => ({
          year: point.year,
          type: item.type,
          count: item.count,
        })),
      ),
    [data],
  );

  const exportColumns = useMemo(
    () => [
      { key: "year", header: t("Year") },
      { key: "type", header: t("Type") },
      { key: "count", header: t("Publications") },
    ],
    [t],
  );

  // Responsável por construir a opção do gráfico, de acordo com o tipo de gráfico selecionado
  const option = useMemo<EChartsOption>(() => {
    const countByYearAndType = new Map<string, number>();

    // Contabiliza a quantidade de publicações por ano e tipo
    data.forEach((point) => {
      point.types.forEach((item) => {
        countByYearAndType.set(`${point.year}::${item.type}`, item.count);
      });
    });

    return {
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
      series: typeNames.map((typeName) => {
        const style = getPublicationTypeStyle(typeName);
        return {
          name: t(typeName),
          type: seriesType,
          stack: "annualByType",
          emphasis: { focus: "series" },
          data: years.map(
            (year) => countByYearAndType.get(`${year}::${typeName}`) ?? 0,
          ),
          itemStyle: {
            color: style.color,
            borderColor: style.borderColor,
            borderWidth: 1,
          },
          ...(chartKind === "bar"
            ? { barMaxWidth: 36 }
            : {
                smooth: false,
                symbol: "circle",
                symbolSize: 4,
                lineStyle: { width: 2, color: style.borderColor },
                ...(chartKind === "area"
                  ? { areaStyle: { color: style.color, opacity: 1 } }
                  : {}),
              }),
        };
      }),
    };
  }, [data, years, typeNames, chartKind, seriesType, textMuted, gridColor, t]);

  // Verifica se o gráfico está vazio
  const empty = !loading && !error && (data.length === 0 || typeNames.length === 0);

  // Retorna o componente do gráfico
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
          <ChartExportMenu
            filename="publicacoes-anuais-por-tipo"
            columns={exportColumns}
            rows={exportRows}
            disabled={loading || error || empty}
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
          empty={empty}
        />
        {!loading && !error && !empty ? (
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
