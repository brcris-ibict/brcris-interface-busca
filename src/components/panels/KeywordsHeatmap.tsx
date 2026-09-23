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
import { PRIMARY_CHART_COLOR } from "./publicationsChartConfig";

// Carrega EChart + registro do wordCloud só no client (pacote usa `window`)
const EChart = dynamic(() => import("./WordCloudEChart"), { ssr: false });

// Props do componente
type Props = {
  filters: PublicationsDashboardFilters;
  height?: number;
};

// Paleta harmônica em torno do teal BrCris + tons complementares suaves.
const WORD_PALETTE = [
  "#0284a0",
  "#0ea5b7",
  "#14b8a6",
  "#0369a1",
  "#5b8def",
  "#7c3aed",
  "#db2777",
  "#e11d48",
  "#ea580c",
  "#d97706",
  "#0f766e",
  "#4338ca",
  "#be185d",
  "#475569",
  "#0891b2",
];

// Função auxiliar para construir a URL da API
function buildUrl(filters: PublicationsDashboardFilters) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([field, value]) => {
    if (value) params.set(field, value);
  });

  const query = params.toString();

  return query
    ? withBasePath(`/api/dashboard/keyword-heatmap?${query}`)
    : withBasePath("/api/dashboard/keyword-heatmap");
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
  const tooltipBg = isDark ? "rgba(17, 24, 39, 0.96)" : "rgba(255, 255, 255, 0.98)";
  const tooltipBorder = isDark ? "#374151" : "#e2e8f0";
  const tooltipText = isDark ? "#e5e7eb" : "#0f172a";
  const canvasBg = isDark
    ? "rgba(17, 24, 39, 0.35)"
    : "rgba(248, 250, 252, 0.9)";

  // Obtém a opção do gráfico
  const option = useMemo<EChartsOption>(() => {
    // Obtém o total de itens
    const total = items.reduce((sum, item) => sum + item.count, 0) || 1;
    const shareByKeyword = new Map(
      items.map((item) => [item.keyword, (item.count / total) * 100]),
    );

    const cloudData = items.map((item) => [item.keyword, item.count]);

    return {
      animationDuration: 650,
      animationEasing: "cubicOut",
      color: WORD_PALETTE,
      backgroundColor: "transparent",
      textStyle: {
        fontFamily: '"rawline", helvetica, arial, sans-serif',
        color: textMuted,
      },
      tooltip: {
        trigger: "item",
        backgroundColor: tooltipBg,
        borderColor: tooltipBorder,
        borderWidth: 1,
        padding: [12, 14],
        extraCssText:
          "border-radius:12px;box-shadow:0 12px 32px rgba(15,23,42,0.16);backdrop-filter:blur(8px);",
        textStyle: {
          color: tooltipText,
          fontSize: 12,
          fontFamily: '"rawline", helvetica, arial, sans-serif',
        },
        formatter: (params: any) => {
          const raw = params?.value;
          const name = String(
            Array.isArray(raw) ? raw[0] : (params?.name ?? ""),
          );
          const count = Number(Array.isArray(raw) ? raw[1] : (params?.value ?? 0));
          const share = Number(shareByKeyword.get(name) ?? 0);
          const color = String(params?.color ?? PRIMARY_CHART_COLOR);

          return [
            `<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">`,
            `<span style="width:10px;height:10px;border-radius:999px;background:${color};flex-shrink:0;"></span>`,
            `<strong style="font-size:14px;line-height:1.2;letter-spacing:-0.01em;">${name}</strong>`,
            `</div>`,
            `<div style="display:flex;flex-direction:column;gap:4px;line-height:1.4;">`,
            `<span style="font-size:18px;font-weight:700;letter-spacing:-0.02em;">${formatPercent(share, locale)}%</span>`,
            `<span style="opacity:0.72;font-size:12px;">${formatCount(count, locale)} ${t("publications")}</span>`,
            `<span style="opacity:0.55;font-size:11px;">${t("of top keywords")}</span>`,
            `</div>`,
          ].join("");
        },
      },
      series: [
        {
          type: "custom",
          renderItem: "wordCloud",
          // wordCloud não usa eixos; default cartesian2d causa "xAxis 0 not found"
          coordinateSystem: "none",
          silent: false,
          itemPayload: {
            left: "1%",
            right: "1%",
            top: "1%",
            bottom: "1%",
            // diamante aproveita melhor o retângulo do que o círculo
            shape: "diamond",
            // 0° e 90°: legível e empacota melhor o espaço
            rotationRange: [0, 90],
            rotationStep: 90,
            sizeRange: [18, 72],
            gridSize: 5,
            shrinkToFit: true,
            drawOutOfBound: true,
          },
          itemStyle: {
            fontFamily: '"rawline", helvetica, arial, sans-serif',
            fontWeight: 650,
          },
          emphasis: {
            focus: "self",
            itemStyle: {
              fontWeight: 800,
              shadowBlur: 12,
              shadowColor: "rgba(15, 23, 42, 0.22)",
            },
          },
          data: cloudData,
        } as any,
      ],
    };
  }, [items, locale, textMuted, tooltipBg, tooltipBorder, tooltipText, t]);

  return (
    <div className="brcris-chart-card brcris-keywords-cloud">
      <div className="brcris-chart-card__header brcris-keywords-cloud__header">
        <div className="brcris-keywords-cloud__heading">
          <h2 className="brcris-chart-card__title">{t("Keywords heatmap")}</h2>
          <p className="brcris-keywords-cloud__caption">
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
                backgroundColor: isDark ? "#111827" : "#ffffff",
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
          <div
            className="brcris-keywords-cloud__canvas"
            style={{ background: canvasBg }}
          >
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
