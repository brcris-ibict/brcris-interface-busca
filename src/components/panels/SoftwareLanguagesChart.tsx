import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "next-i18next";
import type { ECharts, EChartsOption } from "echarts";
import dynamic from "next/dynamic";
import { ChartBar, ChartPie } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import useRequest from "../../hooks/useRequest";
import { withBasePath } from "../../lib/basePath";
import type { SoftwareLanguagesResponse } from "../../types/SoftwareDashboard";
import ChartExportMenu from "./ChartExportMenu";
import ChartFeedback from "./ChartFeedback";
import { getSequentialSliceStyle, sequentialLabelColor } from "./publicationsChartConfig";

const EChart = dynamic(() => import("./EChart"), { ssr: false });

type ChartKind = "pie" | "bar";

const TOGGLES: { kind: ChartKind; Icon: typeof ChartPie; labelKey: string }[] = [
  { kind: "pie", Icon: ChartPie, labelKey: "Chart pie" },
  { kind: "bar", Icon: ChartBar, labelKey: "Chart horizontal bars" },
];

// Fatias abaixo desse percentual levam o rótulo para fora da pizza.
const INSIDE_LABEL_MIN_SHARE = 3;

type Props = {
  height?: number;
};

export default function SoftwareLanguagesChart({ height = 420 }: Props) {
  const { t, i18n } = useTranslation("common");
  const { resolvedTheme } = useTheme();
  const { data, loading, error, get } = useRequest<SoftwareLanguagesResponse>();
  const [chartKind, setChartKind] = useState<ChartKind>("pie");
  const chartRef = useRef<ECharts | null>(null);

  useEffect(() => {
    get(withBasePath("/api/dashboard/software-languages"));
  }, [get]);

  const handleChartReady = useCallback((chart: ECharts | null) => {
    chartRef.current = chart;
  }, []);

  const locale = i18n.language || "pt-BR";
  const items = useMemo(() => data?.items ?? [], [data]);
  const withLanguage = data?.withLanguage ?? 0;
  const total = data?.total ?? 0;
  const isReady = !loading && !error && items.length > 0;
  const title = t("Programming languages");

  const isDark = resolvedTheme === "dark";
  const textMuted = isDark ? "#a1a1aa" : "#555555";
  const gridColor = isDark ? "#2f3542" : "#e5e7eb";
  const labelOutside = isDark ? "#e5e7eb" : "#555555";
  const labelInside = sequentialLabelColor(resolvedTheme);
  const tooltipBg = isDark ? "rgba(17, 24, 39, 0.96)" : "rgba(255, 255, 255, 0.98)";
  const tooltipBorder = isDark ? "#374151" : "#e2e8f0";
  const tooltipText = isDark ? "#e5e7eb" : "#0f172a";

  const formatNumber = useCallback(
    (value: number) => new Intl.NumberFormat(locale).format(value),
    [locale],
  );
  const formatPercent = useCallback(
    (value: number) =>
      `${new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value)}%`,
    [locale],
  );
  const shareOfPrograms = useCallback(
    (count: number) => (withLanguage > 0 ? (count / withLanguage) * 100 : 0),
    [withLanguage],
  );

  const caption = t("Software languages caption", {
    value: formatNumber(withLanguage),
    share: total > 0 ? formatPercent((withLanguage / total) * 100) : "—",
  });

  const option = useMemo<EChartsOption>(() => {
    const tooltipFor = (name: string, count: number) =>
      `<strong>${name}</strong><br/>${t("Software languages tooltip", {
        value: formatNumber(count),
        share: formatPercent(shareOfPrograms(count)),
      })}`;

    const tooltipStyle = {
      backgroundColor: tooltipBg,
      borderColor: tooltipBorder,
      borderWidth: 1,
      padding: [10, 12],
      extraCssText: "border-radius:10px;box-shadow:0 12px 32px rgba(15,23,42,0.28);",
      textStyle: {
        color: tooltipText,
        fontFamily: '"rawline", helvetica, arial, sans-serif',
        fontSize: 13,
      },
    };

    const common = {
      aria: { enabled: true, label: { description: `${title}. ${caption}` } },
      textStyle: {
        fontFamily: '"rawline", helvetica, arial, sans-serif',
        color: textMuted,
      },
      legend: { show: false },
    };

    if (chartKind === "pie") {
      const mentions = items.reduce((sum, item) => sum + item.count, 0) || 1;

      return {
        ...common,
        tooltip: {
          ...tooltipStyle,
          trigger: "item",
          formatter: (params) => {
            const point = Array.isArray(params) ? params[0] : params;
            return tooltipFor(String(point?.name ?? ""), Number(point?.value ?? 0));
          },
        },
        series: [
          {
            type: "pie",
            radius: "68%",
            center: ["50%", "52%"],
            padAngle: 0.6,
            avoidLabelOverlap: true,
            itemStyle: { borderWidth: 1 },
            label: {
              show: true,
              formatter: (params) => {
                const percent = Number(params.percent ?? 0);
                return percent >= INSIDE_LABEL_MIN_SHARE
                  ? `{name|${params.name}}\n{pct|${formatPercent(percent)}}`
                  : `{nameSmall|${params.name}}\n{pctSmall|${formatPercent(percent)}}`;
              },
              rich: {
                name: { fontSize: 12, fontWeight: 600, color: labelInside, lineHeight: 16, align: "center" },
                pct: { fontSize: 13, fontWeight: 700, color: labelInside, lineHeight: 18, align: "center" },
                nameSmall: { fontSize: 11, fontWeight: 600, color: labelOutside, lineHeight: 15 },
                pctSmall: { fontSize: 11, fontWeight: 700, color: labelOutside, lineHeight: 15 },
              },
            },
            labelLine: {
              show: true,
              length: 12,
              length2: 10,
              lineStyle: { color: gridColor, width: 1 },
            },
            labelLayout: { hideOverlap: true },
            data: items.map((item, index) => ({
              name: item.name,
              value: item.count,
              label: {
                position: (item.count / mentions) * 100 >= INSIDE_LABEL_MIN_SHARE ? "inside" : "outside",
              },
              itemStyle: getSequentialSliceStyle(index, items.length, resolvedTheme),
            })),
          },
        ],
      };
    }

    return {
      ...common,
      tooltip: {
        ...tooltipStyle,
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params) => {
          const point = Array.isArray(params) ? params[0] : params;
          return tooltipFor(String(point?.name ?? ""), Number(point?.value ?? 0));
        },
      },
      grid: { left: 8, right: 88, top: 8, bottom: 8, containLabel: true },
      xAxis: {
        type: "value",
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { show: false },
        splitLine: { show: false },
      },
      yAxis: {
        type: "category",
        data: items.map((item) => item.name).reverse(),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: textMuted, fontSize: 12 },
      },
      series: [
        {
          type: "bar",
          barMaxWidth: 64,
          barCategoryGap: "30%",
          data: items
            .map((item, index) => ({
              value: item.count,
              itemStyle: {
                color: getSequentialSliceStyle(index, items.length, resolvedTheme).color,
                borderRadius: 0,
              },
            }))
            .reverse(),
          label: {
            show: true,
            position: "right",
            color: textMuted,
            fontSize: 12,
            formatter: (params) => {
              const value = Number(params.value);
              return `${formatNumber(value)} (${formatPercent(shareOfPrograms(value))})`;
            },
          },
        },
      ],
    };
  }, [
    caption,
    chartKind,
    formatNumber,
    formatPercent,
    gridColor,
    items,
    labelInside,
    labelOutside,
    resolvedTheme,
    shareOfPrograms,
    t,
    textMuted,
    title,
    tooltipBg,
    tooltipBorder,
    tooltipText,
  ]);

  const exportColumns = useMemo(
    () => [
      { key: "language", header: t("Programming language") },
      { key: "software", header: t("Software") },
      { key: "share", header: t("Share of software with language") },
    ],
    [t],
  );

  const exportRows = useMemo(
    () =>
      items.map((item) => ({
        language: item.name,
        software: item.count,
        share: Number(shareOfPrograms(item.count).toFixed(1)),
      })),
    [items, shareOfPrograms],
  );

  return (
    <div className="brcris-chart-card h-100">
      <div className="brcris-chart-card__header">
        <div className="brcris-knowledge-areas__heading">
          <h2 className="brcris-chart-card__title">{title}</h2>
          <p className="brcris-knowledge-areas__caption">{caption}</p>
        </div>
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
            filename="linguagens-de-programacao"
            columns={exportColumns}
            rows={exportRows}
            getChart={() => chartRef.current}
            imageTitle={title}
            disabled={!isReady}
          />
        </div>
      </div>
      <div className="brcris-chart-card__body" aria-busy={loading}>
        <ChartFeedback height={height} loading={loading} error={Boolean(error)} empty={items.length === 0} />
        {isReady ? <EChart option={option} height={height} onChartReady={handleChartReady} /> : null}
      </div>
    </div>
  );
}
