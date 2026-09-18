import { useCallback, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "next-i18next";
import type { ECharts, EChartsOption } from "echarts";
import dynamic from "next/dynamic";
import { useTheme } from "../../contexts/ThemeContext";
import useRequest from "../../hooks/useRequest";
import { withBasePath } from "../../lib/basePath";
import type { PublicationsDashboardFilters, PublicationsKeywordHeatmap } from "../../types/PublicationsDashboard";
import ChartExportMenu from "./ChartExportMenu";
import ChartFeedback from "./ChartFeedback";
import { PRIMARY_CHART_COLOR, hexToRgba } from "./publicationsChartConfig";

const EChart = dynamic(() => import("./EChart"), { ssr: false });

// Props do componente
type Props = {
  filters: PublicationsDashboardFilters;
  height?: number;
};

// Paleta harmônica em torno do teal BrCris + tons complementares suaves.
const TREEMAP_PALETTE = [
  "#0284a0",
  "#0ea5b7",
  "#14b8a6",
  "#2dd4bf",
  "#67c5d8",
  "#0891b2",
  "#0369a1",
  "#0e7490",
  "#5b8def",
  "#7c9cff",
  "#8b5cf6",
  "#a78bfa",
  "#db2777",
  "#ec4899",
  "#f43f5e",
  "#fb7185",
  "#f59e0b",
  "#fbbf24",
  "#64748b",
  "#94a3b8",
  "#475569",
  "#334155",
  "#06b6d4",
  "#22d3ee",
  "#4f46e5",
  "#6366f1",
  "#c026d3",
  "#e879f9",
  "#ea580c",
  "#fb923c",
];

// Função auxiliar para construir a URL da API
function buildUrl(filters: PublicationsDashboardFilters) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([field, value]) => {
    if (value) params.set(field, value);
  });

  const query = params.toString();

  return query ? withBasePath(`/api/dashboard/keyword-heatmap?${query}`) : withBasePath("/api/dashboard/keyword-heatmap");

}

// Função auxiliar para formatar percentuais
function formatPercent(value: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}

// Função auxiliar para formatar contagens
function formatCount(value: number, locale: string) {
  return new Intl.NumberFormat(locale).format(value);
}

// Função auxiliar para converter hex para RGB
function hexToRgb(hex: string) {
  const value = hex.replace("#", "");
  // Retorna o RGB
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };

}

// Função auxiliar para definir as cores dos labels
function labelColorsFor(bg: string) {
  const { r, g, b } = hexToRgb(bg);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  const dark = luminance > 0.62;

  return {
    name: dark ? "#0f172a" : "#f8fafc",
    pct: dark ? hexToRgba("#0f172a", 0.72) : hexToRgba("#f8fafc", 0.88),
  };
}


export default function KeywordsHeatmap({ filters, height = 520 }: Props) {
  const { t, i18n } = useTranslation("common");
  const { resolvedTheme } = useTheme();
  const { data, loading, error, get } = useRequest<PublicationsKeywordHeatmap>();
  const chartRef = useRef<ECharts | null>(null);

  const handleChartReady = useCallback((chart: ECharts | null) => {
    chartRef.current = chart;
  }, []);

  useEffect(() => {
    get(buildUrl(filters));
  }, [filters, get]);

  // Obtém os itens
  const items = data?.items ?? [];

  const exportRows = useMemo(
    () =>
      items.map((item) => ({
        keyword: item.keyword,
        count: item.count,
      })),
    [items],
  );

  const exportColumns = useMemo(
    () => [
      { key: "keyword", header: t("Keywords") },
      { key: "count", header: t("Publications") },
    ],
    [t],
  );

  // Obtém o locale
  const locale = i18n.language || "pt-BR";
  const isDark = resolvedTheme === "dark";
  const textMuted = isDark ? "#a1a1aa" : "#64748b";
  const borderColor = isDark ? "#111827" : "#ffffff";
  const tooltipBg = isDark ? "rgba(17, 24, 39, 0.94)" : "rgba(255, 255, 255, 0.96)";
  const tooltipBorder = isDark ? "#374151" : "#e2e8f0";
  const tooltipText = isDark ? "#e5e7eb" : "#0f172a";

  // Obtém a opção do gráfico
  const option = useMemo<EChartsOption>(() => {
    // Obtém o total de itens
    const total = items.reduce((sum, item) => sum + item.count, 0) || 1;

    const treeData = items.map((item, index) => {
      const share = (item.count / total) * 100;
      const tileColor = TREEMAP_PALETTE[index % TREEMAP_PALETTE.length];
      const labels = labelColorsFor(tileColor);

      return {
        name: item.keyword,
        value: item.count,
        share,
        itemStyle: {
          color: tileColor,
          borderColor,
          borderWidth: 1,
          borderRadius: 4,
          gapWidth: 1,
          shadowBlur: 0,
          shadowColor: "transparent",
        },
        label: {
          color: labels.name,
        },
        labelColors: labels,
      };
    });

    return {
      animationDuration: 450,
      animationEasing: "cubicOut",
      textStyle: {
        fontFamily: '"rawline", helvetica, arial, sans-serif',
        color: textMuted,
      },
      tooltip: {
        trigger: "item",
        backgroundColor: tooltipBg,
        borderColor: tooltipBorder,
        borderWidth: 1,
        padding: [10, 12],
        extraCssText: "border-radius:10px;box-shadow:0 10px 28px rgba(15,23,42,0.14);backdrop-filter:blur(6px);",
        textStyle: {
          color: tooltipText,
          fontSize: 12,
          fontFamily: '"rawline", helvetica, arial, sans-serif',
        },
        formatter: (params: any) => {
          const name = String(params?.name ?? "");
          const count = Number(params?.value ?? 0);
          const share = Number(params?.data?.share ?? 0);
          const color = String(params?.color ?? PRIMARY_CHART_COLOR);

          return [
            `<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">`,
            `<span style="width:10px;height:10px;border-radius:999px;background:${color};flex-shrink:0;"></span>`,
            `<strong style="font-size:13px;line-height:1.2;">${name}</strong>`,
            `</div>`,
            `<div style="opacity:0.9;line-height:1.45;">`,
            `${formatCount(count, locale)} ${t("publications")}`,
            `<br/>`,
            `<span style="opacity:0.8;">${formatPercent(share, locale)}% ${t("of top keywords")}</span>`,
            `</div>`,
          ].join("");
        },
      },
      series: [
        {
          type: "treemap",
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          width: "100%",
          height: "100%",
          roam: false,
          nodeClick: false,
          breadcrumb: { show: false },
          leafDepth: 1,
          squareRatio: 0.65 * (1 + Math.sqrt(5)),
          visibleMin: 1,
          label: {
            show: true,
            position: "insideTopLeft",
            padding: [10, 12],
            formatter: (params: any) => {
              const name = String(params?.name ?? "");
              const share = Number(params?.data?.share ?? 0);

              // Tiles pequenos: só %; muito pequenos: sem label (evita ruído)
              if (share < 1.8) return "";
              if (share < 2.8) {
                return `{pct|${formatPercent(share, locale)}%}`;
              }

              const short =
                name.length > 22 ? `${name.slice(0, 20)}…` : name;

              return [
                `{name|${short}}`,
                `{pct|${formatPercent(share, locale)}%}`,
              ].join("\n");
            },
            rich: {
              name: {
                fontSize: 12,
                fontWeight: 650,
                lineHeight: 17,
                color: "inherit",
              },
              pct: {
                fontSize: 18,
                fontWeight: 700,
                lineHeight: 24,
                padding: [4, 0, 0, 0],
                color: "inherit",
              },
            },
          },
          upperLabel: { show: false },
          itemStyle: {
            borderColor,
            borderWidth: 1,
            borderRadius: 4,
            gapWidth: 1,
          },
          emphasis: {
            focus: "none",
            itemStyle: {
              shadowBlur: 0,
              borderWidth: 1,
            },
          },
          data: treeData.map((item) => ({
            ...item,
            label: {
              color: item.labelColors.name,
              rich: {
                name: { color: item.labelColors.name },
                pct: { color: item.labelColors.pct },
              },
            },
          })),
        },
      ],
    };
  }, [
    items,
    locale,
    textMuted,
    borderColor,
    tooltipBg,
    tooltipBorder,
    tooltipText,
    isDark,
    t,
  ]);

  return (
    <div className="brcris-chart-card brcris-keywords-treemap">
      <div className="brcris-chart-card__header brcris-keywords-treemap__header">
        <div className="brcris-keywords-treemap__heading">
          <h2 className="brcris-chart-card__title">
            {t("Keywords heatmap")}
          </h2>
          <p className="brcris-keywords-treemap__caption">
            {t("Keywords heatmap caption")}
          </p>
        </div>
        <div className="brcris-chart-card__toggles" role="group">
          <ChartExportMenu
            filename="palavras-chave"
            columns={exportColumns}
            rows={exportRows}
            disabled={loading || Boolean(error) || items.length === 0}
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
          error={Boolean(error)}
          empty={!loading && !error && items.length === 0}
        />

        {!loading && !error && items.length > 0 ? (
          <div className="brcris-keywords-treemap__canvas">
            <EChart
              option={option}
              height={height}
              onChartReady={handleChartReady}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
