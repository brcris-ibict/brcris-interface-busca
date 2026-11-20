import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "next-i18next";
import type { ECharts, EChartsOption } from "echarts";
import dynamic from "next/dynamic";
import { ChartBar, ChartPie } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import useRequest from "../../hooks/useRequest";
import { withBasePath } from "../../lib/basePath";
import type { PatentKindResponse } from "../../types/PatentsDashboard";
import ChartExportMenu from "./ChartExportMenu";
import ChartFeedback from "./ChartFeedback";
import {
  MISSING_SLICE_COLOR,
  PRIMARY_CHART_COLOR,
  chartFillColor,
  getPanelSeriesStyle,
} from "./publicationsChartConfig";

const EChart = dynamic(() => import("./EChart"), { ssr: false });

type ChartKind = "bar" | "pie";

const TOGGLES: { kind: ChartKind; Icon: typeof ChartPie; labelKey: string }[] = [
  { kind: "bar", Icon: ChartBar, labelKey: "Chart horizontal bars" },
  { kind: "pie", Icon: ChartPie, labelKey: "Chart pie" },
];

// Na rosca, só os maiores códigos ganham fatia própria; o resto vira "Outros códigos".
const PIE_TOP_SLICES = 5;
const FONT_FAMILY = '"rawline", helvetica, arial, sans-serif';

type PieSlice = {
  name: string;
  codes: string[];
  count: number;
  isOther: boolean;
};

type Props = {
  height?: number;
};

export default function PatentsKindChart({ height = 400 }: Props) {
  const { t, i18n } = useTranslation("common");
  const { resolvedTheme } = useTheme();
  const { data, loading, error, get } = useRequest<PatentKindResponse>();
  const [chartKind, setChartKind] = useState<ChartKind>("bar");
  const chartRef = useRef<ECharts | null>(null);

  useEffect(() => {
    get(withBasePath("/api/dashboard/patents-kind"));
  }, [get]);

  const handleChartReady = useCallback((chart: ECharts | null) => {
    chartRef.current = chart;
  }, []);

  const locale = i18n.language || "pt-BR";
  const items = useMemo(() => data?.items ?? [], [data]);
  const total = data?.total ?? 0;
  const isReady = !loading && !error && items.length > 0;
  const title = t("Patent stage");

  const isDark = resolvedTheme === "dark";
  const textMain = isDark ? "#e5e7eb" : "#1f2937";
  const textMuted = isDark ? "#a1a1aa" : "#555555";
  const trackColor = isDark ? "rgba(255, 255, 255, 0.05)" : "#f1f5f9";
  const sliceSeparator = isDark ? "#171b22" : "#fefefe";
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
  const shareOfPatents = useCallback(
    (count: number) => (total > 0 ? (count / total) * 100 : 0),
    [total],
  );
  const stageLabel = useCallback(
    (code: string) => {
      const key = `Patent kind ${code}`;
      const label = t(key);
      return label === key ? code : label;
    },
    [t],
  );

  const caption = t("Patent stage caption", { value: formatNumber(total) });

  const pieSlices = useMemo<PieSlice[]>(() => {
    const top = items.slice(0, PIE_TOP_SLICES).map((item) => ({
      name: stageLabel(item.code),
      codes: [item.code],
      count: item.count,
      isOther: false,
    }));
    const rest = items.slice(PIE_TOP_SLICES);
    if (rest.length === 0) return top;

    return [
      ...top,
      {
        name: t("Other codes", { value: rest.length }),
        codes: rest.map((item) => item.code),
        count: rest.reduce((sum, item) => sum + item.count, 0),
        isOther: true,
      },
    ];
  }, [items, stageLabel, t]);

  const option = useMemo<EChartsOption>(() => {
    const tooltipFor = (name: string, codes: string, count: number) =>
      `<strong>${name}</strong><br/>${t("Patent stage tooltip", {
        code: codes,
        value: formatNumber(count),
        share: formatPercent(shareOfPatents(count)),
      })}`;

    const common = {
      aria: { enabled: true, label: { description: `${title}. ${caption}` } },
      textStyle: { fontFamily: FONT_FAMILY, color: textMuted },
    };

    const tooltipStyle = {
      backgroundColor: tooltipBg,
      borderColor: tooltipBorder,
      borderWidth: 1,
      padding: [10, 12],
      extraCssText: "border-radius:10px;box-shadow:0 12px 32px rgba(15,23,42,0.28);",
      textStyle: { color: tooltipText, fontFamily: FONT_FAMILY, fontSize: 13 },
    };

    if (chartKind === "pie") {
      const shareByName = new Map(
        pieSlices.map((slice) => [slice.name, shareOfPatents(slice.count)]),
      );
      const centerY = Math.round(height * 0.4);

      return {
        ...common,
        tooltip: {
          ...tooltipStyle,
          trigger: "item",
          formatter: (params) => {
            const point = Array.isArray(params) ? params[0] : params;
            const slice = pieSlices[point?.dataIndex ?? -1];
            return slice ? tooltipFor(slice.name, slice.codes.join(", "), slice.count) : "";
          },
        },
        legend: {
          type: "plain",
          orient: "horizontal",
          left: "center",
          bottom: 0,
          width: "94%",
          icon: "circle",
          itemWidth: 10,
          itemHeight: 10,
          itemGap: 14,
          textStyle: { color: textMuted, fontSize: 12 },
          formatter: (name: string) => `${name}  ${formatPercent(shareByName.get(name) ?? 0)}`,
        },
        graphic: [
          {
            type: "text",
            left: "center",
            top: centerY - 22,
            style: {
              text: formatNumber(total),
              fill: textMain,
              fontSize: 22,
              fontWeight: 700,
              fontFamily: FONT_FAMILY,
              textAlign: "center",
            },
          },
          {
            type: "text",
            left: "center",
            top: centerY + 6,
            style: {
              text: t("patents unit short"),
              fill: textMuted,
              fontSize: 12,
              fontFamily: FONT_FAMILY,
              textAlign: "center",
            },
          },
        ],
        series: [
          {
            type: "pie",
            radius: ["48%", "72%"],
            center: ["50%", "40%"],
            padAngle: 1,
            label: { show: false },
            labelLine: { show: false },
            emphasis: { scale: true, scaleSize: 4 },
            data: pieSlices.map((slice, index) => {
              const baseColor = slice.isOther
                ? MISSING_SLICE_COLOR[resolvedTheme]
                : getPanelSeriesStyle(index, "light").color;
              return {
                name: slice.name,
                value: slice.count,
                itemStyle: {
                  color: chartFillColor(baseColor, resolvedTheme),
                  borderColor: isDark ? baseColor : sliceSeparator,
                  borderWidth: isDark ? 1 : 2,
                  borderRadius: 4,
                },
              };
            }),
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
          const item = items[point?.dataIndex ?? -1];
          return item ? tooltipFor(stageLabel(item.code), item.code, item.count) : "";
        },
      },
      grid: { left: 8, right: 104, top: 4, bottom: 4, containLabel: true },
      xAxis: { type: "value", show: false },
      yAxis: {
        type: "category",
        inverse: true,
        data: items.map((item) => `${item.code} · ${stageLabel(item.code)}`),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: textMuted, fontSize: 12, width: 210, overflow: "truncate" },
      },
      series: [
        {
          type: "bar",
          barWidth: 16,
          showBackground: true,
          backgroundStyle: { color: trackColor, borderRadius: [0, 4, 4, 0] },
          itemStyle: {
            color: chartFillColor(PRIMARY_CHART_COLOR, resolvedTheme),
            borderColor: PRIMARY_CHART_COLOR,
            borderWidth: isDark ? 1 : 0,
            borderRadius: [0, 4, 4, 0],
          },
          label: {
            show: true,
            position: "right",
            color: textMain,
            fontSize: 12,
            formatter: (params) => {
              const value = Number(params.value);
              return `${formatNumber(value)} · ${formatPercent(shareOfPatents(value))}`;
            },
          },
          data: items.map((item) => item.count),
        },
      ],
    };
  }, [
    caption,
    chartKind,
    formatNumber,
    formatPercent,
    height,
    isDark,
    items,
    pieSlices,
    resolvedTheme,
    shareOfPatents,
    sliceSeparator,
    stageLabel,
    t,
    textMain,
    textMuted,
    title,
    tooltipBg,
    tooltipBorder,
    tooltipText,
    total,
    trackColor,
  ]);

  const exportColumns = useMemo(
    () => [
      { key: "code", header: t("Patent kind code") },
      { key: "stage", header: t("Patent stage name") },
      { key: "patents", header: t("Patents") },
      { key: "share", header: t("Share of patents") },
    ],
    [t],
  );

  const exportRows = useMemo(
    () =>
      items.map((item) => ({
        code: item.code,
        stage: stageLabel(item.code),
        patents: item.count,
        share: Number(shareOfPatents(item.count).toFixed(1)),
      })),
    [items, shareOfPatents, stageLabel],
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
            filename="estagio-da-patente"
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
