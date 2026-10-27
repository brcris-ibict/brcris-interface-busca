import { useCallback, useMemo, useRef } from "react";
import { useTranslation } from "next-i18next";
import type { ECharts, EChartsOption } from "echarts";
import dynamic from "next/dynamic";
import { useTheme } from "../../contexts/ThemeContext";
import type { PeopleIdentifiersMatrix } from "../../types/PeopleDashboard";
import ChartExportMenu from "./ChartExportMenu";
import ChartFeedback from "./ChartFeedback";

const EChart = dynamic(() => import("./EChart"), { ssr: false });

import { BRCRIS_PALETTE } from "../../../utils/Utils";

type Props = {
  data?: PeopleIdentifiersMatrix;
  loading: boolean;
  error: boolean;
  height?: number;
};

type Cell = {
  orcid: 0 | 1;
  lattes: 0 | 1;
  count: number;
};

// Escala usando a paleta brCris: suave (#CFE7FF / #D9D2FF) até os tons primários (#0284A0 / #071D41)
const LIGHT_SCALE = [
  "#f0f9ff",
  BRCRIS_PALETTE.softBlue, // #CFE7FF
  "#38bdf8",
  BRCRIS_PALETTE.primary,  // #0284A0
  BRCRIS_PALETTE.darkBlue, // #071D41
];

const DARK_SCALE = [
  "#0b1e36",
  "#0e3b5e",
  BRCRIS_PALETTE.primary,  // #0284A0
  "#38bdf8",
  BRCRIS_PALETTE.softBlue, // #CFE7FF
];

function formatCount(value: number, locale: string) {
  return new Intl.NumberFormat(locale).format(value);
}

function formatPercent(value: number, locale: string) {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value);
}

export default function IdentifiersMatrix({ data, loading, error, height = 380 }: Props) {
  const { t, i18n } = useTranslation("common");
  const { resolvedTheme } = useTheme();
  const chartRef = useRef<ECharts | null>(null);

  const handleChartReady = useCallback((chart: ECharts | null) => {
    chartRef.current = chart;
  }, []);

  const locale = i18n.language || "pt-BR";
  const isDark = resolvedTheme === "dark";
  const textMuted = isDark ? "#a1a1aa" : "#555555";

  const orcidLabels = useMemo(() => [t("With ORCID"), t("Without ORCID")], [t]);
  const lattesLabels = useMemo(() => [t("With Lattes"), t("Without Lattes")], [t]);

  // Índice 0 = possui o identificador; 1 = não possui
  const cells = useMemo<Cell[]>(
    () =>
      data
        ? [
            { orcid: 0, lattes: 0, count: data.both },
            { orcid: 0, lattes: 1, count: data.orcidOnly },
            { orcid: 1, lattes: 0, count: data.lattesOnly },
            { orcid: 1, lattes: 1, count: data.none },
          ]
        : [],
    [data],
  );

  const total = cells.reduce((sum, cell) => sum + cell.count, 0);
  const maxCount = Math.max(...cells.map((cell) => cell.count), 1);
  const hasData = total > 0;
  const isReady = !loading && !error && hasData;

  const share = useCallback(
    (count: number) => (total > 0 ? (count / total) * 100 : 0),
    [total],
  );

  const exportRows = useMemo(
    () =>
      cells.map((cell) => ({
        orcid: orcidLabels[cell.orcid],
        lattes: lattesLabels[cell.lattes],
        count: cell.count,
        share: Number(share(cell.count).toFixed(2)),
      })),
    [cells, orcidLabels, lattesLabels, share],
  );

  const exportColumns = useMemo(
    () => [
      { key: "orcid", header: "ORCID" },
      { key: "lattes", header: "Lattes" },
      { key: "count", header: t("Researchers") },
      { key: "share", header: `${t("Participation")} (%)` },
    ],
    [t],
  );

  const option = useMemo<EChartsOption>(() => {
    const scale = isDark ? DARK_SCALE : LIGHT_SCALE;

    return {
      textStyle: {
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      },
      tooltip: {
        formatter: (params: unknown) => {
          const value = (params as { value?: [number, number, number] }).value;
          if (!value) return "";
          const [orcidIdx, lattesIdx, count] = value;
          return `<strong>${orcidLabels[orcidIdx]} · ${lattesLabels[lattesIdx]}</strong><br/>${formatCount(
            count,
            locale,
          )} ${t("researchers")} (${formatPercent(share(count), locale)}%)`;
        },
      },
      grid: { top: 36, bottom: 16, left: 16, right: 16, containLabel: true },
      xAxis: {
        type: "category",
        position: "top",
        data: orcidLabels,
        axisTick: { show: false },
        axisLine: { show: false },
        axisLabel: { color: textMuted, fontSize: 12, fontWeight: 600 },
      },
      yAxis: {
        type: "category",
        data: lattesLabels,
        inverse: true,
        axisTick: { show: false },
        axisLine: { show: false },
        axisLabel: { color: textMuted, fontSize: 12, fontWeight: 600 },
      },
      visualMap: {
        show: false,
        min: 0,
        max: maxCount,
        inRange: { color: scale },
      },
      series: [
        {
          type: "heatmap",
          itemStyle: { borderColor: isDark ? "#171b22" : "#ffffff", borderWidth: 4, borderRadius: 6 },
          data: cells.map((cell) => {
            const strong = !isDark && cell.count / maxCount > 0.5;
            return {
              value: [cell.orcid, cell.lattes, cell.count],
              label: {
                show: true,
                color: isDark || strong ? "#ffffff" : "#1f2937",
                fontSize: 14,
                fontWeight: 600,
                lineHeight: 20,
                formatter: `${formatCount(cell.count, locale)}\n${formatPercent(share(cell.count), locale)}%`,
              },
            };
          }),
          emphasis: { itemStyle: { shadowBlur: 8, shadowColor: "rgba(0, 0, 0, 0.3)" } },
        },
      ],
    };
  }, [cells, isDark, lattesLabels, locale, maxCount, orcidLabels, share, t, textMuted]);

  return (
    <div className="brcris-chart-card">
      <div className="brcris-chart-card__header">
        <div className="brcris-knowledge-areas__heading">
          <h2 className="brcris-chart-card__title">{t("Identifiers matrix")}</h2>
          <p className="brcris-knowledge-areas__caption">{t("Identifiers matrix caption")}</p>
        </div>
        <div className="brcris-chart-card__toggles" role="group">
          <ChartExportMenu
            filename="matriz-identificadores-orcid-lattes"
            columns={exportColumns}
            rows={exportRows}
            disabled={!isReady}
            getChart={() => chartRef.current}
            imageTitle={t("Identifiers matrix")}
          />
        </div>
      </div>
      <div className="brcris-chart-card__body" aria-busy={loading}>
        <ChartFeedback height={height} loading={loading} error={error} empty={!hasData} />
        {isReady && <EChart option={option} height={height} onChartReady={handleChartReady} />}
      </div>
    </div>
  );
}
