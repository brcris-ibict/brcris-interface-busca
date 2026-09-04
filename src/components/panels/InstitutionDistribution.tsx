import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "next-i18next";
import type { EChartsOption } from "echarts";
import dynamic from "next/dynamic";
import { ChartBar, ChartPie, Plus, RotateCcw } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import type { PublicationsByInstitutionPoint } from "../../types/PublicationsDashboard";
import ChartFeedback from "./ChartFeedback";
import {
  PRIMARY_CHART_COLOR,
  getPanelSeriesStyle,
  hexToRgba,
} from "./publicationsChartConfig";

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
  data: PublicationsByInstitutionPoint[];
  totalPublications?: number;
  publicationsWithoutInstitution?: number;
  loading: boolean;
  error: boolean;
  height?: number;
};

// Altura das linhas do gráfico de barras
// Existe porque o gráfico de barras é scrollável
// Está relacionada a função handleLoadMore
const BAR_ROW_HEIGHT = 52;

// Quantidade de itens visíveis por página
const PAGE_SIZE = 10;

// Limite de caracteres para o nome da instituição
const LABEL_MAX_CHARS = 32;

// Limite de itens para o gráfico de pizza
const PIE_SLICE_LIMIT = 10;

// Função responsável por abreviar o nome da instituição
// Aqui faz o truncate do nome da instituição
function shortenLabel(name: string) {
  if (name.length <= LABEL_MAX_CHARS) return name;
  return `${name.slice(0, LABEL_MAX_CHARS - 1)}…`;
}

// Função responsável por construir os dados para o gráfico de pizza
// O gráfico apresenta as 10 instituições com mais publicações e as outras instituições
// O objetivo de forma destacada as 10 mais que publicam e quanto isso representa em relação ao todo,
// as que estão fora do top 10 e quanto isso representa em relação ao todo,
// e a instituição sem vinculo com uma instituição de referência e quanto isso representa em relação ao todo.
function buildInstitutionPieSeries(
  data: PublicationsByInstitutionPoint[],
  topInstitutionsLabel: string,
  othersLabel: string,
  withoutInstitutionLabel: string,
  totalPublications?: number,
  publicationsWithoutInstitution = 0,
) {
  const topInstitutionsCount = data.slice(0, PIE_SLICE_LIMIT).reduce((sum, item) => sum + item.count, 0); // Soma a quantidade de publicações por instituição
  const othersInstitutionsCount = data.slice(PIE_SLICE_LIMIT).reduce((sum, item) => sum + item.count, 0); // Soma as outras instituições

  // Array de dados para o gráfico de pizza
  const series: {
    name: string;
    value: number;
    isWithoutInstitution?: boolean;
  }[] = [];

  // Parte 1) Adiciona a instituição com mais publicações
  if (topInstitutionsCount > 0) {
    series.push({
      name: topInstitutionsLabel,
      value: topInstitutionsCount,
    });
  }

  // Parte 2) Adiciona as outras instituições
  if (othersInstitutionsCount > 0) {
    series.push({
      name: othersLabel,
      value: othersInstitutionsCount,
    });
  }

  // Parte 3) Adiciona a instituição sem vinculo com uma instituição de referência
  if (publicationsWithoutInstitution > 0) {
    series.push({
      name: withoutInstitutionLabel,
      value: publicationsWithoutInstitution,
      isWithoutInstitution: true,
    });
  }

  // Soma a quantidade total de publicações por instituição
  const institutionsTotal = data.reduce((sum, item) => sum + item.count, 0);

  // Soma a quantidade total de publicações por instituição e a instituição sem vinculo com uma instituição de referência
  const total = totalPublications ?? institutionsTotal + publicationsWithoutInstitution;

  return { series, total };
}

// Componente principal
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

  // Atualiza a quantidade de itens visíveis quando os dados mudam
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [data]);

  // Retorna os dados visíveis
  const visibleData = useMemo(
    () => data.slice(0, visibleCount),
    [data, visibleCount],
  );

  const hasMore = visibleData.length < data.length; // Verifica se ainda existem mais itens para carregar

  // Carrega mais itens quando o usuário clica no botão "Carregar mais"
  const handleLoadMore = () => {
    setVisibleCount((current) => Math.min(current + PAGE_SIZE, data.length));
  };

  const canReset = visibleCount > PAGE_SIZE; // Verifica se ainda existem itens para resetar

  // Reseta a quantidade de itens visíveis
  const handleReset = () => {
    setVisibleCount(PAGE_SIZE);
  };

  const textMuted = resolvedTheme === "dark" ? "#a1a1aa" : "#555555";
  const gridColor = resolvedTheme === "dark" ? "#2f3542" : "#e5e7eb";
  const barChartHeight = visibleData.length * BAR_ROW_HEIGHT;

  const hasChartData = data.length > 0 || publicationsWithoutInstitution > 0;

  // Responsável por construir a opção do gráfico, de acordo com o tipo de gráfico selecionado
  const option = useMemo<EChartsOption>(() => {
    const common = {
      textStyle: {
        fontFamily: '"rawline", helvetica, arial, sans-serif',
        color: textMuted,
      },
    };
    const chartData = visibleData;
    const textMain = resolvedTheme === "dark" ? "#e5e7eb" : "#333333";
    const withoutInstitutionColor = resolvedTheme === "dark" ? "#6b7280" : "#9ca3af";

    // Construção do gráfico de pizza
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
            padAngle: 1,
            avoidLabelOverlap: true,
            itemStyle: {
              borderWidth: 1,
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
            data: pieSeriesData.map((item, index) => {
              if (item.isWithoutInstitution) {
                return {
                  name: item.name,
                  value: item.value,
                  itemStyle: {
                    color: withoutInstitutionColor,
                    borderColor: withoutInstitutionColor,
                    borderWidth: 1,
                  },
                };
              }
              const style = getPanelSeriesStyle(index);
              return {
                name: item.name,
                value: item.value,
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

    const fullNames = chartData.map((item) => item.institution).reverse();
    const shortLabels = fullNames.map(shortenLabel);

    // Construção do gráfico de barras
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
          data: chartData.map((item) => item.count).reverse(),
          barMaxWidth: 44,
          barCategoryGap: "32%",
          itemStyle: {
            color: hexToRgba(PRIMARY_CHART_COLOR, 0.28),
            borderColor: PRIMARY_CHART_COLOR,
            borderWidth: 1,
            borderRadius: 0,
          },
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
  }, [data, visibleData, chartKind, textMuted, gridColor, resolvedTheme, t, totalPublications, publicationsWithoutInstitution]);

  return (
    <div className="brcris-chart-card" style={{ height: `500px` }}>
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
            />
          </div>
        ) : null}

        {!loading && !error && hasChartData && chartKind === "bar" ? (
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
