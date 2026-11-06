import { useCallback, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "next-i18next";
import type { ECharts, EChartsOption, TreemapSeriesOption } from "echarts";
import dynamic from "next/dynamic";
import { BRCRIS_PALETTE } from "../../../utils/Utils";
import { useTheme } from "../../contexts/ThemeContext";
import useRequest from "../../hooks/useRequest";
import { withBasePath } from "../../lib/basePath";
import type { ProgramsAreaInstitutionResponse } from "../../types/ProgramsDashboard";
import ChartExportMenu from "./ChartExportMenu";
import ChartFeedback from "./ChartFeedback";

const EChart = dynamic(() => import("./EChart"), { ssr: false });

type Props = {
  height?: number;
};

type TreemapNode = {
  name: string;
  value: number;
  area: string;
  areaTotal: number;
  isArea: boolean;
};

// Uma cor por posição no ranking, para as 10 áreas nunca repetirem cor
const AREA_COLORS = [
  BRCRIS_PALETTE.primary,
  "#0d9488",
  "#6366f1",
  "#8B5CF6",
  "#EC4899",
  "#38bdf8",
  "#10b981",
  BRCRIS_PALETTE.darkBlue,
  "#0891b2",
  "#d946ef",
];
const LIGHT_CARD_BG = "#ffffff";
const DARK_CARD_BG = "#171b22";
const MIN_LABEL_SHARE = 1.5;

function luminance(hex: string) {
  const value = parseInt(hex.replace("#", ""), 16);
  const [r, g, b] = [(value >> 16) & 255, (value >> 8) & 255, value & 255].map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function readableText(hex: string) {
  return luminance(hex) > 0.4 ? "#1f2937" : "#ffffff";
}

function formatPercent(value: number, locale: string) {
  return new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

export default function AreaInstitutionTreemap({ height = 420 }: Props) {
  const { t, i18n } = useTranslation("common");
  const { resolvedTheme } = useTheme();
  const { data, loading, error, get } = useRequest<ProgramsAreaInstitutionResponse>();
  const chartRef = useRef<ECharts | null>(null);

  useEffect(() => {
    get(withBasePath("/api/dashboard/programs-area-institution"));
  }, [get]);

  const handleChartReady = useCallback((chart: ECharts | null) => {
    chartRef.current = chart;
  }, []);

  const locale = i18n.language || "pt-BR";
  const isDark = resolvedTheme === "dark";
  const cardBg = isDark ? DARK_CARD_BG : LIGHT_CARD_BG;
  const headerText = isDark ? "#e5e7eb" : "#1f2937";

  const areas = useMemo(
    () => (data?.areas ?? []).filter((area) => area.institutions.length > 0),
    [data],
  );
  // Mesmo critério do Kibana: % sobre a soma das instituições exibidas
  const shownTotal = useMemo(
    () => areas.reduce((sum, area) => sum + area.institutions.reduce((acc, item) => acc + item.count, 0), 0),
    [areas],
  );
  const hasData = shownTotal > 0;
  const isReady = !loading && !error && hasData;

  const formatCount = useCallback(
    (value: number) => new Intl.NumberFormat(locale).format(value),
    [locale],
  );

  const percentOf = useCallback(
    (value: number) => formatPercent(shownTotal > 0 ? (value / shownTotal) * 100 : 0, locale),
    [locale, shownTotal],
  );

  const option = useMemo<EChartsOption>(() => {
    const treemapData = areas.map((area, index) => {
      const color = AREA_COLORS[index % AREA_COLORS.length];
      const text = readableText(color);
      return {
        name: area.area,
        value: area.institutions.reduce((sum, item) => sum + item.count, 0),
        area: area.area,
        areaTotal: area.count,
        isArea: true,
        itemStyle: { color, borderColor: cardBg },
        children: area.institutions.map((item) => ({
          name: item.name,
          value: item.count,
          area: area.area,
          areaTotal: area.count,
          isArea: false,
          itemStyle: { color, borderColor: cardBg },
          label: { color: text },
        })),
      };
    });

    return {
      textStyle: { fontFamily: '"rawline", helvetica, arial, sans-serif' },
      tooltip: {
        trigger: "item",
        confine: true,
        formatter: (params: unknown) => {
          const node = (params as { data?: TreemapNode }).data;
          if (!node) return "";
          const areaTotal = t("Area total programs", { total: formatCount(node.areaTotal) });
          if (node.isArea) {
            const shown = t("Shown institutions programs", {
              total: formatCount(node.value),
              share: percentOf(node.value),
            });
            return `<strong>${node.name}</strong><br/>${areaTotal}<br/>${shown}`;
          }
          const count = `${formatCount(node.value)} ${t("programs")} · ${percentOf(node.value)}%`;
          return `<strong>${node.name}</strong><br/>${count}<br/><br/>${node.area}<br/>${areaTotal}`;
        },
      },
      series: [
        {
          type: "treemap",
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          roam: false,
          nodeClick: false,
          breadcrumb: { show: false },
          label: {
            show: true,
            overflow: "break",
            fontSize: 12,
            fontWeight: 600,
            lineHeight: 16,
            formatter: (params: unknown) => {
              const node = (params as { data?: TreemapNode }).data;
              if (!node || node.isArea) return "";
              const pct = shownTotal > 0 ? (node.value / shownTotal) * 100 : 0;
              return pct < MIN_LABEL_SHARE ? "" : `${node.name}\n${percentOf(node.value)}%`;
            },
          },
          upperLabel: {
            show: true,
            height: 22,
            color: headerText,
            fontSize: 12,
            fontWeight: 700,
            overflow: "truncate",
            formatter: (params: unknown) => {
              const node = (params as { data?: TreemapNode }).data;
              return node?.isArea
                ? `${node.name} · ${formatCount(node.areaTotal)} ${t("programs")} · ${percentOf(node.value)}%`
                : "";
            },
          },
          itemStyle: { borderColor: cardBg },
          levels: [
            { itemStyle: { borderWidth: 0, gapWidth: 6, borderColor: cardBg }, upperLabel: { show: false } },
            { itemStyle: { borderWidth: 2, gapWidth: 2, borderColor: cardBg } },
            { itemStyle: { borderWidth: 0, gapWidth: 2 }, upperLabel: { show: false } },
          ],
          data: treemapData as unknown as NonNullable<TreemapSeriesOption["data"]>,
        },
      ],
    };
  }, [areas, cardBg, formatCount, headerText, percentOf, shownTotal, t]);

  const exportColumns = useMemo(
    () => [
      { key: "area", header: t("Evaluation area") },
      { key: "institution", header: t("Institution") },
      { key: "programs", header: t("Programs") },
      { key: "share", header: "%" },
    ],
    [t],
  );

  const exportRows = useMemo(
    () =>
      areas.flatMap((area) =>
        area.institutions.map((item) => ({
          area: area.area,
          institution: item.name,
          programs: item.count,
          share: Number(((item.count / Math.max(shownTotal, 1)) * 100).toFixed(2)),
        })),
      ),
    [areas, shownTotal],
  );

  return (
    <div className="brcris-chart-card h-100">
      <div className="brcris-chart-card__header">
        <div className="brcris-knowledge-areas__heading">
          <h2 className="brcris-chart-card__title">{t("Knowledge areas by institution (CAPES)")}</h2>
          <p className="brcris-knowledge-areas__caption">{t("Knowledge areas by institution caption")}</p>
        </div>
        <div className="brcris-chart-card__toggles" role="group">
          <ChartExportMenu
            filename="areas-conhecimento-por-instituicao-capes"
            columns={exportColumns}
            rows={exportRows}
            getChart={() => chartRef.current}
            imageTitle={t("Knowledge areas by institution (CAPES)")}
            disabled={!isReady}
          />
        </div>
      </div>
      <div className="brcris-chart-card__body" aria-busy={loading}>
        <ChartFeedback height={height} loading={loading} error={Boolean(error)} empty={!hasData} />
        {isReady ? <EChart option={option} height={height} onChartReady={handleChartReady} /> : null}
      </div>
    </div>
  );
}
