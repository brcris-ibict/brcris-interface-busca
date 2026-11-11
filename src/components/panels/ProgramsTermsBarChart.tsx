import { useCallback, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "next-i18next";
import type { ECharts, EChartsOption } from "echarts";
import dynamic from "next/dynamic";
import { useTheme } from "../../contexts/ThemeContext";
import useRequest from "../../hooks/useRequest";
import { withBasePath } from "../../lib/basePath";
import type { ProgramsTermsResponse } from "../../types/ProgramsDashboard";
import ChartExportMenu from "./ChartExportMenu";
import ChartFeedback from "./ChartFeedback";
import { PRIMARY_CHART_COLOR, chartFillColor } from "./publicationsChartConfig";

const EChart = dynamic(() => import("./EChart"), { ssr: false });

type Props = {
  by: "capesArea" | "institution" | "networkSize";
  titleKey: string;
  captionKey: string;
  nameHeaderKey: string;
  filename: string;
  translateNames?: boolean;
  height?: number;
};

export default function ProgramsTermsBarChart({
  by,
  titleKey,
  captionKey,
  nameHeaderKey,
  filename,
  translateNames = false,
  height = 460,
}: Props) {
  const { t, i18n } = useTranslation("common");
  const { resolvedTheme } = useTheme();
  const { data, loading, error, get } = useRequest<ProgramsTermsResponse>();
  const chartRef = useRef<ECharts | null>(null);

  useEffect(() => {
    get(withBasePath(`/api/dashboard/programs-terms?by=${by}`));
  }, [by, get]);

  const handleChartReady = useCallback((chart: ECharts | null) => {
    chartRef.current = chart;
  }, []);

  const locale = i18n.language || "pt-BR";
  const items = useMemo(
    () => (data?.items ?? []).map((item) => (translateNames ? { ...item, name: t(item.name) } : item)),
    [data, t, translateNames],
  );
  const isReady = !loading && !error && items.length > 0;
  const textMuted = resolvedTheme === "dark" ? "#a1a1aa" : "#555555";

  const option = useMemo<EChartsOption>(
    () => ({
      textStyle: {
        fontFamily: '"rawline", helvetica, arial, sans-serif',
        color: textMuted,
      },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        valueFormatter: (value) => `${new Intl.NumberFormat(locale).format(Number(value))} ${t("graduate programs unit")}`,
      },
      legend: { show: false },
      grid: { left: 12, right: 56, top: 8, bottom: 8, containLabel: true },
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
        axisLabel: {
          color: textMuted,
          fontSize: 12,
          lineHeight: 16,
          margin: 12,
          width: 260,
          overflow: "break",
        },
      },
      series: [
        {
          type: "bar",
          name: t("Programs"),
          data: items.map((item) => item.count).reverse(),
          barMaxWidth: 64,
          barCategoryGap: "30%",
          itemStyle: {
            color: chartFillColor(PRIMARY_CHART_COLOR, resolvedTheme),
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
            formatter: (params) => new Intl.NumberFormat(locale).format(Number(params.value)),
          },
        },
      ],
    }),
    [items, locale, resolvedTheme, t, textMuted],
  );

  const exportColumns = useMemo(
    () => [
      { key: "name", header: t(nameHeaderKey) },
      { key: "programs", header: t("Programs") },
    ],
    [nameHeaderKey, t],
  );

  const exportRows = useMemo(
    () => items.map((item) => ({ name: item.name, programs: item.count })),
    [items],
  );

  return (
    <div className="brcris-chart-card h-100">
      <div className="brcris-chart-card__header">
        <div className="brcris-knowledge-areas__heading">
          <h2 className="brcris-chart-card__title">{t(titleKey)}</h2>
          <p className="brcris-knowledge-areas__caption">{t(captionKey)}</p>
        </div>
        <div className="brcris-chart-card__toggles" role="group">
          <ChartExportMenu
            filename={filename}
            columns={exportColumns}
            rows={exportRows}
            getChart={() => chartRef.current}
            imageTitle={t(titleKey)}
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
