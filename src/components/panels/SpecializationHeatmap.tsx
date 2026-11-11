import { useCallback, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "next-i18next";
import type { ECharts, EChartsOption } from "echarts";
import dynamic from "next/dynamic";
import { useTheme } from "../../contexts/ThemeContext";
import useRequest from "../../hooks/useRequest";
import { withBasePath } from "../../lib/basePath";
import type {
  PeopleDashboardFilters,
  PeopleSpecializationHeatmap,
} from "../../types/PeopleDashboard";
import ChartExportMenu from "./ChartExportMenu";
import ChartFeedback from "./ChartFeedback";
import { BRCRIS_PALETTE } from "../../../utils/Utils";

const EChart = dynamic(() => import("./EChart"), { ssr: false });

type Props = {
  filters: PeopleDashboardFilters;
  height?: number;
};

const LABEL_MAX_CHARS = 38;

function shortenLabel(name: string) {
  if (name.length <= LABEL_MAX_CHARS) return name;
  return `${name.slice(0, LABEL_MAX_CHARS - 1)}…`;
}

function buildUrl(filters: PeopleDashboardFilters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([field, value]) => {
    if (value) params.set(field, value);
  });
  const query = params.toString();
  return query
    ? withBasePath(`/api/dashboard/people-specialization?${query}`)
    : withBasePath("/api/dashboard/people-specialization");
}

function formatCount(value: number, locale: string) {
  return new Intl.NumberFormat(locale).format(value);
}

export default function SpecializationHeatmap({
  filters,
  height = 480,
}: Props) {
  const { t, i18n } = useTranslation("common");
  const { resolvedTheme } = useTheme();
  const { data, loading, error, get } = useRequest<PeopleSpecializationHeatmap>();
  const chartRef = useRef<ECharts | null>(null);

  const handleChartReady = useCallback((chart: ECharts | null) => {
    chartRef.current = chart;
  }, []);

  useEffect(() => {
    get(buildUrl(filters));
  }, [filters, get]);

  const locale = i18n.language || "pt-BR";
  const isDark = resolvedTheme === "dark";
  const textMuted = isDark ? "#a1a1aa" : "#555555";
  const gridColor = isDark ? "#2f3542" : "#e5e7eb";

  const institutions = useMemo(() => data?.institutions ?? [], [data]);
  const majorAreas = useMemo(() => data?.majorAreas ?? [], [data]);
  const matrix = useMemo(() => data?.matrix ?? [], [data]);
  const items = useMemo(() => data?.items ?? [], [data]);

  const hasData = items.length > 0;
  const isReady = !loading && !error && hasData;

  const exportRows = useMemo(
    () =>
      items.map((item) => ({
        institution: item.institution,
        majorArea: item.majorArea,
        count: item.count,
      })),
    [items],
  );

  const exportColumns = useMemo(
    () => [
      { key: "institution", header: t("Affiliation") },
      { key: "majorArea", header: t("Major area") },
      { key: "count", header: t("Researchers") },
    ],
    [t],
  );

  const maxVal = useMemo(() => {
    if (matrix.length === 0) return 100;
    return Math.max(...matrix.map(([, , val]) => val), 1);
  }, [matrix]);

  const option = useMemo<EChartsOption>(() => {
    return {
      textStyle: {
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      },
      tooltip: {
        position: "top",
        formatter: (params: unknown) => {
          const p = params as { data: [number, number, number] };
          if (!p.data) return "";
          const [areaIdx, instIdx, count] = p.data;
          const inst = institutions[instIdx] || "";
          const area = majorAreas[areaIdx] || "";
          return `<strong>${inst}</strong><br/>${area}<br/><strong>${formatCount(
            count,
            locale,
          )}</strong> ${t("researchers")}`;
        },
      },
      grid: {
        top: "4%",
        bottom: "22%",
        left: "24%",
        right: "8%",
      },
      xAxis: {
        type: "category",
        data: majorAreas,
        splitArea: { show: false },
        splitLine: { show: true, lineStyle: { color: gridColor } },
        axisLabel: {
          color: textMuted,
          rotate: 35,
          interval: 0,
          fontSize: 11,
          formatter: (value: string) => shortenLabel(value),
        },
        axisLine: { lineStyle: { color: gridColor } },
      },
      yAxis: {
        type: "category",
        data: institutions.map((inst) => shortenLabel(inst)),
        inverse: true,
        splitArea: { show: false },
        splitLine: { show: true, lineStyle: { color: gridColor } },
        axisLabel: {
          color: textMuted,
          fontSize: 11,
        },
        axisLine: { lineStyle: { color: gridColor } },
      },
      visualMap: {
        min: 0,
        max: maxVal,
        calculable: true,
        orient: "horizontal",
        left: "center",
        bottom: 0,
        inRange: {
          color: isDark
            ? ["#0b1e36", "#0e3b5e", BRCRIS_PALETTE.primary, "#38bdf8", BRCRIS_PALETTE.softBlue]
            : ["#f0f9ff", BRCRIS_PALETTE.softBlue, "#38bdf8", BRCRIS_PALETTE.primary, BRCRIS_PALETTE.darkBlue],
        },
        textStyle: { color: textMuted },
      },
      series: [
        {
          name: t("Institutional specialization"),
          type: "heatmap",
          // ECharts heatmap espera [índice no eixo X, índice no eixo Y, valor]
          data: matrix.map(([instIdx, areaIdx, count]) => [areaIdx, instIdx, count]),
          label: {
            show: matrix.length <= 150,
            formatter: (params: unknown) => {
              const val = (params as { data: [number, number, number] }).data[2];
              return val > 0 ? String(val) : "";
            },
            color: isDark ? "#ffffff" : "#1f2937",
            fontSize: 10,
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: "rgba(0, 0, 0, 0.5)",
            },
          },
        },
      ],
    };
  }, [gridColor, institutions, isDark, locale, majorAreas, matrix, maxVal, t, textMuted]);

  return (
    <div className="brcris-chart-card">
      <div className="brcris-chart-card__header">
        <div className="brcris-knowledge-areas__heading">
          <h2 className="brcris-chart-card__title">
            {t("Institutional specialization")}
          </h2>
          <p className="brcris-knowledge-areas__caption">
            {t("Institutional specialization caption")}
          </p>
        </div>
        <div className="brcris-chart-card__toggles" role="group">
          <ChartExportMenu
            filename="especializacao-institucional"
            columns={exportColumns}
            rows={exportRows}
            disabled={!isReady}
            getChart={() => chartRef.current}
            imageTitle={t("Institutional specialization")}
          />
        </div>
      </div>
      <div className="brcris-chart-card__body" aria-busy={loading}>
        <ChartFeedback
          height={height}
          loading={loading}
          error={Boolean(error)}
          empty={!hasData}
        />
        {isReady && (
          <EChart
            option={option}
            height={height}
            onChartReady={handleChartReady}
          />
        )}
      </div>
    </div>
  );
}
