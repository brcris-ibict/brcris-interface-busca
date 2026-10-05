import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "next-i18next";
import type { ECharts, EChartsOption } from "echarts";
import dynamic from "next/dynamic";
import { ChartBar, ChartPie } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import useRequest from "../../hooks/useRequest";
import useFilterLoadingReport from "../../hooks/useFilterLoadingReport";
import { withBasePath } from "../../lib/basePath";
import type {
  PublicationsDashboardFilters,
  PublicationsTeamSize,
  PublicationsTeamSizeBand,
} from "../../types/PublicationsDashboard";
import ChartExportMenu from "./ChartExportMenu";
import ChartFeedback from "./ChartFeedback";
import { PRIMARY_CHART_COLOR, chartFillColor, hexToRgba } from "./publicationsChartConfig";

const EChart = dynamic(() => import("./EChart"), { ssr: false });

type Props = {
  filters: PublicationsDashboardFilters;
  height?: number;
  onLoadingChange?: (loading: boolean) => void;
};

const TEAM_BAND_LABEL_KEYS: Record<PublicationsTeamSizeBand, string> = {
  "1": "Team size 1",
  "2": "Team size 2",
  "3-5": "Team size 3-5",
  "6-10": "Team size 6-10",
  "11+": "Team size 11+",
};

type ChartKind = "bar" | "pie";

const TOGGLES: {
  kind: ChartKind;
  Icon: typeof ChartPie;
  labelKey: string;
}[] = [
  { kind: "pie", Icon: ChartPie, labelKey: "Chart pie" },
  { kind: "bar", Icon: ChartBar, labelKey: "Chart horizontal bars" },
];

// Faixas são ordinais: escala sequencial do tom primário (mais escuro = equipe menor)
const TEAM_BAND_COLORS: Record<PublicationsTeamSizeBand, string> = {
  "1": "#015a6e",
  "2": "#0284a0",
  "3-5": "#22a7c2",
  "6-10": "#6ec8da",
  "11+": "#b5e3ec",
};

// Dark: mesmo padrão dos outros painéis (fill translúcido + borda sólida);
// a ordem das faixas aparece pela intensidade do preenchimento
const DARK_PIE_BORDER = "#67c5d8";
const DARK_PIE_FILL_ALPHA: Record<PublicationsTeamSizeBand, number> = {
  "1": 0.55,
  "2": 0.42,
  "3-5": 0.3,
  "6-10": 0.2,
  "11+": 0.12,
};

const MIN_INSIDE_PIE_LABEL_SHARE = 3;

function buildUrl(filters: PublicationsDashboardFilters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([field, value]) => {
    if (value) params.set(field, value);
  });
  const query = params.toString();
  return query
    ? withBasePath(`/api/dashboard/authorship-team-size?${query}`)
    : withBasePath("/api/dashboard/authorship-team-size");
}

function share(part: number, total: number) {
  return total > 0 ? (part / total) * 100 : 0;
}

function formatPercent(value: number, locale: string, digits = 1) {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: digits }).format(value);
}

function formatCount(value: number, locale: string) {
  return new Intl.NumberFormat(locale).format(value);
}

function axisIndex(params: unknown) {
  const items = Array.isArray(params) ? params : [params];
  return (items[0] as { dataIndex?: number } | undefined)?.dataIndex ?? 0;
}

export default function AuthorshipTeamSize({ filters, height = 410, onLoadingChange }: Props) {
  const { t, i18n } = useTranslation("common");
  const { resolvedTheme } = useTheme();
  const { data, loading, error, get } = useRequest<PublicationsTeamSize>();
  useFilterLoadingReport(filters, loading, onLoadingChange);
  const chartRef = useRef<ECharts | null>(null);
  const [chartKind, setChartKind] = useState<ChartKind>("pie");

  const handleChartReady = useCallback((chart: ECharts | null) => {
    chartRef.current = chart;
  }, []);

  useEffect(() => {
    get(buildUrl(filters));
  }, [
    filters.publicationDate,
    filters.type,
    filters.language,
    filters.institution,
    get,
    filters,
  ]);

  const locale = i18n.language || "pt-BR";
  const isDark = resolvedTheme === "dark";
  const textMuted = isDark ? "#a1a1aa" : "#555555";
  const gridColor = isDark ? "#2f3542" : "#e5e7eb";

  const bands = useMemo(() => data?.bands ?? [], [data]);
  const withAuthors = data?.withAuthors ?? 0;
  const withoutAuthors = data?.withoutAuthors ?? 0;
  const hasData = withAuthors > 0;
  const isReady = !loading && !error && hasData;

  const option = useMemo<EChartsOption>(() => {
    const labels = bands.map((band) => t(TEAM_BAND_LABEL_KEYS[band.band]));

    if (chartKind === "pie") {
      return {
        textStyle: {
          fontFamily: '"rawline", helvetica, arial, sans-serif',
          color: textMuted,
        },
        aria: { enabled: true },
        tooltip: {
          trigger: "item",
          formatter: (params: unknown) => {
            const { dataIndex = 0 } = params as { dataIndex?: number };
            const band = bands[dataIndex];
            if (!band) return "";
            return `<strong>${labels[dataIndex]}</strong><br/>${formatPercent(share(band.count, withAuthors), locale)}% (${formatCount(band.count, locale)} ${t("publications")})`;
          },
        },
        legend: { show: false },
        series: [
          {
            name: t("Publications"),
            type: "pie",
            radius: "68%",
            center: ["50%", "52%"],
            padAngle: 0.6,
            avoidLabelOverlap: true,
            label: {
              show: true,
              formatter: (params: unknown) => {
                const { name = "", value = 0 } = params as { name?: string; value?: number };
                const percent = share(Number(value), withAuthors);
                return `{name|${name}}\n{pct|${formatPercent(percent, locale)}%}`;
              },
              rich: {
                name: { fontSize: 12, fontWeight: 600, lineHeight: 16, align: "center" },
                pct: { fontSize: 13, fontWeight: 700, lineHeight: 18, align: "center" },
              },
            },
            labelLine: {
              show: true,
              length: 12,
              length2: 10,
              lineStyle: { color: gridColor, width: 1 },
            },
            labelLayout: { hideOverlap: true },
            data: bands.map((band, index) => {
              const percent = share(band.count, withAuthors);
              const isInside = percent >= MIN_INSIDE_PIE_LABEL_SHARE;
              const isLightSlice = band.band === "6-10" || band.band === "11+";
              const labelColor = isDark
                ? "#e5e7eb"
                : isInside && !isLightSlice
                  ? "#ffffff"
                  : "#1f2937";
              return {
                name: labels[index],
                value: band.count,
                label: {
                  position: isInside ? "inside" : "outside",
                  color: labelColor,
                },
                itemStyle: isDark
                  ? {
                      color: hexToRgba(DARK_PIE_BORDER, DARK_PIE_FILL_ALPHA[band.band]),
                      borderColor: DARK_PIE_BORDER,
                      borderWidth: 1,
                    }
                  : {
                      color: TEAM_BAND_COLORS[band.band],
                      borderColor: "#ffffff",
                      borderWidth: 1,
                    },
              };
            }),
          },
        ],
      };
    }

    return {
      textStyle: {
        fontFamily: '"rawline", helvetica, arial, sans-serif',
        color: textMuted,
      },
      aria: { enabled: true },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params: unknown) => {
          const index = axisIndex(params);
          const band = bands[index];
          if (!band) return "";
          return `<strong>${labels[index]}</strong><br/>${formatPercent(share(band.count, withAuthors), locale)}% (${formatCount(band.count, locale)} ${t("publications")})`;
        },
      },
      grid: { left: 104, right: 52, top: 4, bottom: 28, containLabel: false },
      xAxis: {
        type: "value",
        axisLabel: { formatter: "{value}%", color: textMuted, fontSize: 11 },
        splitLine: { lineStyle: { color: gridColor } },
      },
      yAxis: {
        type: "category",
        inverse: true,
        data: labels,
        axisTick: { show: false },
        axisLine: { show: false },
        axisLabel: { color: textMuted, fontSize: 12 },
      },
      series: [
        {
          name: t("Publications"),
          type: "bar",
          barMaxWidth: 44,
          itemStyle: {
            color: chartFillColor(PRIMARY_CHART_COLOR, resolvedTheme),
            borderColor: PRIMARY_CHART_COLOR,
            borderWidth: 1,
          },
          label: {
            show: true,
            position: "right",
            color: textMuted,
            fontSize: 12,
            formatter: (params: { value?: unknown }) =>
              `${formatPercent(Number(params.value), locale)}%`,
          },
          data: bands.map((band) => Number(share(band.count, withAuthors).toFixed(2))),
        },
      ],
    };
  }, [chartKind, bands, withAuthors, t, locale, textMuted, gridColor, resolvedTheme, isDark]);

  const exportColumns = useMemo(
    () => [
      { key: "band", header: t("Team size") },
      { key: "count", header: t("Publications") },
      { key: "share", header: t("Share of publications with authors (%)") },
    ],
    [t],
  );

  const exportRows = useMemo(() => {
    const rows: Record<string, string | number>[] = bands.map((band) => ({
      band: t(TEAM_BAND_LABEL_KEYS[band.band]),
      count: band.count,
      share: Number(share(band.count, withAuthors).toFixed(1)),
    }));
    if (withoutAuthors > 0) {
      rows.push({ band: t("Without authorship"), count: withoutAuthors, share: "" });
    }
    return rows;
  }, [bands, withAuthors, withoutAuthors, t]);

  return (
    <div className="brcris-chart-card brcris-team-size h-100" style={{ minHeight: 500 }}>
      <div className="brcris-chart-card__header brcris-team-size__header">
        <div className="brcris-team-size__heading">
          <h2 className="brcris-chart-card__title">{t("Team size distribution")}</h2>
          <p className="brcris-team-size__caption">{t("Team size caption")}</p>
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
            filename="tamanho-equipes-autoria"
            columns={exportColumns}
            rows={exportRows}
            disabled={loading || Boolean(error) || !hasData}
            getChart={() => chartRef.current}
            imageTitle={t("Team size distribution")}
          />
        </div>
      </div>

      <div className="brcris-chart-card__body" aria-busy={loading}>
        <ChartFeedback
          height={height}
          loading={loading}
          error={Boolean(error)}
          empty={!loading && !error && !hasData}
        />

        {isReady ? (
          <EChart option={option} height={height} onChartReady={handleChartReady} />
        ) : null}
      </div>
    </div>
  );
}
