import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { useTranslation } from "next-i18next";
import type { ECharts, EChartsOption, TreemapSeriesOption } from "echarts";
import dynamic from "next/dynamic";
import { ArrowLeft, CheckCircle2, LayoutGrid, List, LoaderCircle } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import useRequest from "../../hooks/useRequest";
import useFilterLoadingReport from "../../hooks/useFilterLoadingReport";
import { withBasePath } from "../../lib/basePath";
import type { KnowledgeAreaItem, KnowledgeAreasResponse } from "../../types/KnowledgeAreas";
import type { PublicationsDashboardFilters } from "../../types/PublicationsDashboard";
import ChartExportMenu from "./ChartExportMenu";
import ChartFeedback from "./ChartFeedback";
import { hexToRgba } from "./publicationsChartConfig";

const EChart = dynamic(() => import("./EChart"), { ssr: false });

type Props = {
  filters: PublicationsDashboardFilters;
  height?: number;
  onLoadingChange?: (loading: boolean) => void;
};

type View = "map" | "list";

type PendingFocus = { parent: string | null; target: string | null };

type TreemapDatum = {
  name: string;
  value: number;
  isOther: boolean;
  groupedNames: string[];
};

type AreaStyle = { fill: string; border: string; text: string };

const VIEW_TOGGLES: { view: View; Icon: typeof LayoutGrid; labelKey: string }[] = [
  { view: "map", Icon: LayoutGrid, labelKey: "Map view" },
  { view: "list", Icon: List, labelKey: "List view" },
];

// Paleta Okabe-Ito (segura para daltonismo); amarelo escurecido para a borda aparecer no fundo claro
const MAJOR_AREA_COLORS: Record<string, string> = {
  "Ciências Exatas e da Terra": "#0072B2",
  "Ciências Biológicas": "#009E73",
  Engenharias: "#56B4E9",
  "Ciências da Saúde": "#E69F00",
  "Ciências Agrárias": "#B8A000",
  "Ciências Sociais Aplicadas": "#CC79A7",
  "Ciências Humanas": "#D55E00",
  "Linguística, Letras e Artes": "#882255",
};
const FALLBACK_COLORS = ["#0072B2", "#009E73", "#E69F00", "#CC79A7", "#D55E00", "#56B4E9", "#882255", "#B8A000"];
const OTHER_COLOR = "#9CA3AF";
const DARK_TEXT = "#1f2937";
const MIN_FULL_LABEL_SHARE = 4;
const MAX_TOOLTIP_GROUPED = 8;
const MOBILE_QUERY = "(max-width: 575.98px)";
const BUILD_POLL_MS = 30000;
const UPDATING_POLL_MS = 20000;
const UPDATED_BADGE_MS = 4000;

function buildUrl(parent: string | null, filters: PublicationsDashboardFilters) {
  const params = new URLSearchParams();
  if (parent) params.set("area", parent);
  Object.entries(filters).forEach(([field, value]) => {
    if (value) params.set(field, value);
  });
  const query = params.toString();
  return withBasePath(`/api/dashboard/knowledge-areas${query ? `?${query}` : ""}`);
}

// Hash estável: grandes áreas fora do mapa mantêm a mesma cor entre os níveis
function colorFor(name: string) {
  if (MAJOR_AREA_COLORS[name]) return MAJOR_AREA_COLORS[name];
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return FALLBACK_COLORS[hash % FALLBACK_COLORS.length];
}

function toChannels(hex: string) {
  const value = parseInt(hex.replace("#", ""), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function tint(hex: string, ratio: number) {
  return `#${toChannels(hex)
    .map((channel) => Math.round(channel + (255 - channel) * ratio))
    .map((channel) => channel.toString(16).padStart(2, "0"))
    .join("")}`;
}

function relativeLuminance(hex: string) {
  const [r, g, b] = toChannels(hex).map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function readableTextColor(backgroundHex: string) {
  const luminance = relativeLuminance(backgroundHex);
  const contrastWithDark = (luminance + 0.05) / (relativeLuminance(DARK_TEXT) + 0.05);
  const contrastWithWhite = 1.05 / (luminance + 0.05);
  return contrastWithDark >= contrastWithWhite ? DARK_TEXT : "#ffffff";
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

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [query]);
  return matches;
}

export default function KnowledgeAreasTreemap({ filters, height = 380, onLoadingChange }: Props) {
  const { t, i18n } = useTranslation("common");
  const { resolvedTheme } = useTheme();
  const { data, loading, error, get } = useRequest<KnowledgeAreasResponse>();
  useFilterLoadingReport(filters, loading, onLoadingChange);
  const [parent, setParent] = useState<string | null>(null);
  const [view, setView] = useState<View>("map");
  const [chart, setChart] = useState<ECharts | null>(null);
  const chartRef = useRef<ECharts | null>(null);
  const currentLevelRef = useRef<HTMLSpanElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const pendingFocusRef = useRef<PendingFocus | null>(null);
  const isMobile = useMediaQuery(MOBILE_QUERY);
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const highContrast = useMediaQuery("(prefers-contrast: more)");

  useEffect(() => {
    if (isMobile) setView("list");
  }, [isMobile]);

  useEffect(() => {
    get(buildUrl(parent, filters));
  }, [parent, filters, get]);

  const handleChartReady = useCallback((instance: ECharts | null) => {
    chartRef.current = instance;
    setChart(instance);
  }, []);

  const locale = i18n.language || "pt-BR";
  const isDark = resolvedTheme === "dark";
  const textMuted = isDark ? "#a1a1aa" : "#555555";

  const items = useMemo(() => data?.items ?? [], [data]);
  const totalWithArea = data?.totalWithArea ?? 0;
  const level = data?.level ?? 1;
  const levelParent = data?.parent ?? null;
  const hasData = items.length > 0;
  const isReady = !loading && !error && hasData;
  // Servidor calcula os dados em segundo plano após uma atualização da base
  const isBuilding = data?.status === "building" && !error;
  const isUpdating = data?.status === "updating" && !error;
  const levelLabel = levelParent ?? t("Major areas");

  useEffect(() => {
    if (!isBuilding || loading) return;
    const timer = window.setTimeout(() => get(buildUrl(parent, filters)), BUILD_POLL_MS);
    return () => window.clearTimeout(timer);
  }, [isBuilding, loading, parent, filters, get]);

  const [justUpdated, setJustUpdated] = useState(false);

  // Versão nova em background: consulta silenciosa para não esconder o gráfico nem travar filtros
  useEffect(() => {
    if (!isUpdating || loading) return;
    let cancelled = false;
    const timer = window.setInterval(async () => {
      try {
        const response = await fetch(buildUrl(parent, filters));
        if (!response.ok) return;
        const next = (await response.json()) as KnowledgeAreasResponse;
        if (cancelled || next.status === "updating") return;
        get(buildUrl(parent, filters));
        setJustUpdated(true);
      } catch {
        // Falha pontual: tenta de novo no próximo ciclo
      }
    }, UPDATING_POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [isUpdating, loading, parent, filters, get]);

  useEffect(() => {
    if (!justUpdated) return;
    const timer = window.setTimeout(() => setJustUpdated(false), UPDATED_BADGE_MS);
    return () => window.clearTimeout(timer);
  }, [justUpdated]);

  const updatingTitle =
    isUpdating && data?.generatedAt
      ? t("Knowledge areas updating", {
          date: new Intl.DateTimeFormat(locale).format(new Date(data.generatedAt)),
        })
      : undefined;

  const displayName = useCallback(
    (item: KnowledgeAreaItem) => (item.isOther ? t("Other areas") : item.name),
    [t],
  );

  const openArea = useCallback((name: string) => {
    pendingFocusRef.current = { parent: name, target: null };
    setParent(name);
  }, []);

  const goBack = useCallback(() => {
    if (!parent) return;
    pendingFocusRef.current = { parent: null, target: parent };
    setParent(null);
  }, [parent]);

  // Só move o foco quando o nível pedido terminou de carregar
  useEffect(() => {
    const pending = pendingFocusRef.current;
    if (!pending || loading || levelParent !== pending.parent) return;
    pendingFocusRef.current = null;
    if (pending.target && view === "list") {
      const target = listRef.current?.querySelector<HTMLButtonElement>(
        `[data-area="${CSS.escape(pending.target)}"]`,
      );
      if (target) {
        target.focus();
        return;
      }
    }
    currentLevelRef.current?.focus();
  }, [loading, levelParent, view, data]);

  useEffect(() => {
    if (!chart) return;
    const handleClick = (params: unknown) => {
      const item = (params as { data?: TreemapDatum }).data;
      if (!item || item.isOther || parent) return;
      openArea(item.name);
    };
    chart.on("click", handleClick);
    return () => {
      chart.off("click", handleClick);
    };
  }, [chart, parent, openArea]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!parent) return;
    if (event.key === "Escape" || (event.key === "Backspace" && view === "list")) {
      event.preventDefault();
      goBack();
    }
  };

  const styleFor = useCallback(
    (item: KnowledgeAreaItem, index: number): AreaStyle => {
      if (item.isOther) {
        return isDark
          ? { fill: hexToRgba(OTHER_COLOR, 0.22), border: OTHER_COLOR, text: "#f3f4f6" }
          : { fill: tint(OTHER_COLOR, 0.7), border: OTHER_COLOR, text: DARK_TEXT };
      }

      const base = levelParent ? colorFor(levelParent) : colorFor(item.name);
      const regularCount = items.filter((entry) => !entry.isOther).length;
      // Nível 2: tom mais forte para as áreas maiores (itens já vêm ordenados por volume)
      const position = levelParent ? index / Math.max(regularCount - 1, 1) : 0;

      if (isDark) {
        const alpha = levelParent ? 0.6 - 0.42 * position : 0.34;
        return { fill: hexToRgba(base, alpha), border: tint(base, 0.3), text: "#f3f4f6" };
      }

      const fill = tint(base, levelParent ? 0.3 + 0.5 * position : 0.7);
      return { fill, border: base, text: readableTextColor(fill) };
    },
    [isDark, items, levelParent],
  );

  const announcement = isReady
    ? level === 1
      ? t("Knowledge areas announcement level 1", {
          items: formatCount(items.length, locale),
          total: formatCount(totalWithArea, locale),
        })
      : t("Knowledge areas announcement level 2", {
          items: formatCount(items.length, locale),
          parent: levelParent ?? "",
          total: formatCount(totalWithArea, locale),
        })
    : "";

  const option = useMemo<EChartsOption>(() => {
    const treemapData = items.map((item, index) => {
      const style = styleFor(item, index);
      return {
        name: item.name,
        value: item.count,
        isOther: item.isOther,
        groupedNames: item.groupedNames,
        itemStyle: { color: style.fill, borderColor: style.border },
        label: { color: style.text },
      };
    });

    return {
      textStyle: {
        fontFamily: '"rawline", helvetica, arial, sans-serif',
        color: textMuted,
      },
      animation: !reducedMotion,
      animationDurationUpdate: reducedMotion ? 0 : 450,
      aria: {
        enabled: true,
        label: { description: announcement },
        decal: { show: highContrast },
      },
      tooltip: {
        trigger: "item",
        confine: true,
        formatter: (params: unknown) => {
          const item = (params as { data?: TreemapDatum }).data;
          if (!item) return "";
          const count = `${formatCount(item.value, locale)} ${t("publications")} · ${formatPercent(
            share(item.value, totalWithArea),
            locale,
          )}%`;
          if (item.isOther) {
            const names = item.groupedNames.slice(0, MAX_TOOLTIP_GROUPED).join("<br/>");
            const more = item.groupedNames.length > MAX_TOOLTIP_GROUPED ? "<br/>…" : "";
            return `<strong>${t("Other areas")}</strong><br/>${count}<br/>${t("Other areas grouped", {
              total: item.groupedNames.length,
            })}<br/>${names}${more}`;
          }
          const hint = level === 1 ? `<br/><em>${t("Click to see areas")}</em>` : "";
          return `<strong>${item.name}</strong><br/>${count}${hint}`;
        },
      },
      series: [
        {
          type: "treemap",
          name: levelLabel,
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          roam: false,
          nodeClick: false,
          breadcrumb: { show: false },
          cursor: level === 1 ? "pointer" : "default",
          itemStyle: { gapWidth: 3, borderWidth: 1, borderRadius: 4 },
          label: {
            show: true,
            overflow: "break",
            lineOverflow: "truncate",
            fontSize: 12,
            fontWeight: 600,
            lineHeight: 17,
            formatter: (params: unknown) => {
              const item = (params as { data?: TreemapDatum }).data;
              if (!item) return "";
              const name = item.isOther ? t("Other areas") : item.name;
              const pct = share(item.value, totalWithArea);
              if (pct < MIN_FULL_LABEL_SHARE) return name;
              return `${name}\n${formatPercent(pct, locale)}%`;
            },
          },
          data: treemapData as NonNullable<TreemapSeriesOption["data"]>,
        },
      ],
    };
  }, [
    items,
    styleFor,
    textMuted,
    reducedMotion,
    announcement,
    highContrast,
    locale,
    t,
    totalWithArea,
    level,
    levelLabel,
  ]);

  const exportColumns = useMemo(
    () => [
      { key: "majorArea", header: t("Major area") },
      { key: "area", header: t("Area") },
      { key: "publications", header: t("Publications") },
      { key: "share", header: t("Share of level publications (%)") },
    ],
    [t],
  );

  const exportRows = useMemo(
    () =>
      items.map((item) => {
        const name = item.isOther
          ? `${t("Other areas")} (${item.groupedNames.join("; ")})`
          : item.name;
        return {
          majorArea: levelParent ?? name,
          area: levelParent ? name : "",
          publications: item.count,
          share: Number(share(item.count, totalWithArea).toFixed(1)),
        };
      }),
    [items, levelParent, totalWithArea, t],
  );

  const exportFilename = levelParent
    ? `areas-conhecimento-${slugify(levelParent)}`
    : "areas-conhecimento-grandes-areas";

  return (
    <div
      className="brcris-chart-card brcris-knowledge-areas h-100"
      style={{ minHeight: 500 }}
      onKeyDown={handleKeyDown}
    >
      <div className="brcris-chart-card__header brcris-knowledge-areas__header">
        <div className="brcris-knowledge-areas__heading">
          <h2 className="brcris-chart-card__title">{t("Knowledge areas")}</h2>
          <p className="brcris-knowledge-areas__caption">{t("Knowledge areas caption")}</p>
        </div>

        <div className="brcris-chart-card__toggles" role="group" aria-label={t("Knowledge areas")}>
          {isUpdating ? (
            <span
              className="brcris-update-badge"
              role="status"
              title={updatingTitle}
              aria-label={updatingTitle}
            >
              <LoaderCircle className="brcris-chart-card__spinner" size={14} aria-hidden="true" />
              <span className="brcris-update-badge__text">{t("Knowledge areas updating badge")}</span>
            </span>
          ) : justUpdated ? (
            <span className="brcris-update-badge is-done" role="status">
              <CheckCircle2 size={14} aria-hidden="true" />
              <span className="brcris-update-badge__text">{t("Knowledge areas updated badge")}</span>
            </span>
          ) : null}
          {VIEW_TOGGLES.map(({ view: toggleView, Icon, labelKey }) => (
            <button
              key={toggleView}
              type="button"
              className={view === toggleView ? "is-active" : undefined}
              title={t(labelKey)}
              aria-label={t(labelKey)}
              aria-pressed={view === toggleView}
              onClick={() => setView(toggleView)}
            >
              <Icon size={18} />
            </button>
          ))}
          <ChartExportMenu
            filename={exportFilename}
            columns={exportColumns}
            rows={exportRows}
            disabled={loading || Boolean(error) || !hasData}
            getChart={() => (view === "map" ? chartRef.current : null)}
            imageTitle={`${t("Knowledge areas")} — ${levelLabel}`}
          />
        </div>
      </div>

      <div className="brcris-knowledge-areas__nav">
        {parent ? (
          <button
            type="button"
            className="brcris-knowledge-areas__back"
            onClick={goBack}
            aria-label={t("Go back to major areas")}
            title={t("Go back to major areas")}
          >
            <ArrowLeft size={16} aria-hidden="true" />
          </button>
        ) : null}
        <nav aria-label={t("Knowledge areas navigation")}>
          <ol className="brcris-knowledge-areas__breadcrumb">
            <li>
              {parent ? (
                <button type="button" onClick={goBack}>
                  {t("Major areas")}
                </button>
              ) : (
                <span ref={currentLevelRef} tabIndex={-1} aria-current="page">
                  {t("Major areas")}
                </span>
              )}
            </li>
            {parent ? (
              <li>
                <span ref={currentLevelRef} tabIndex={-1} aria-current="page">
                  {parent}
                </span>
              </li>
            ) : null}
          </ol>
        </nav>
      </div>

      <p className="brcris-knowledge-areas__sr-only" aria-live="polite">
        {announcement}
      </p>

      <div className="brcris-chart-card__body" aria-busy={loading}>
        {isBuilding ? (
          <div className="brcris-chart-card__feedback" style={{ height }} role="status" aria-live="polite">
            <LoaderCircle className="brcris-chart-card__spinner" size={24} aria-hidden="true" />
            <span>{t("Knowledge areas building")}</span>
          </div>
        ) : (
          <ChartFeedback
            height={height}
            loading={loading}
            error={Boolean(error)}
            empty={!loading && !error && !hasData}
            emptyMessage={data?.unsupportedFilter ? t("Knowledge areas institution unavailable") : undefined}
          />
        )}

        {isReady ? (
          <div key={levelParent ?? "root"} className="brcris-knowledge-areas__stage">
            {view === "map" ? (
              <EChart option={option} height={height} onChartReady={handleChartReady} />
            ) : (
              <ul
                ref={listRef}
                className="brcris-knowledge-areas__list"
                style={{ height }}
                aria-label={t("Knowledge areas list")}
              >
                {items.map((item, index) => {
                  const style = styleFor(item, index);
                  const pct = share(item.count, totalWithArea);
                  const name = displayName(item);
                  const canOpen = level === 1 && !item.isOther;
                  const content = (
                    <>
                      <span
                        className="brcris-knowledge-areas__swatch"
                        style={{ background: style.fill, borderColor: style.border }}
                        aria-hidden="true"
                      />
                      <span className="brcris-knowledge-areas__row-name">{name}</span>
                      <span className="brcris-knowledge-areas__row-meta">
                        {formatCount(item.count, locale)} · {formatPercent(pct, locale)}%
                      </span>
                      <span className="brcris-knowledge-areas__bar" aria-hidden="true">
                        <span style={{ width: `${Math.min(pct, 100)}%`, background: style.border }} />
                      </span>
                    </>
                  );

                  return (
                    <li key={item.name}>
                      {canOpen ? (
                        <button
                          type="button"
                          data-area={item.name}
                          className="brcris-knowledge-areas__row"
                          onClick={() => openArea(item.name)}
                          aria-label={t("Open areas of", {
                            name: item.name,
                            total: formatCount(item.count, locale),
                            share: formatPercent(pct, locale),
                          })}
                        >
                          {content}
                        </button>
                      ) : (
                        <div
                          className="brcris-knowledge-areas__row is-static"
                          title={item.isOther ? item.groupedNames.join(", ") : undefined}
                        >
                          {content}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ) : null}

        {isReady ? (
          <p className="brcris-knowledge-areas__note">
            {t("Knowledge areas note")}
            {data?.generatedAt
              ? ` ${t(isUpdating ? "Knowledge areas updating" : "Updated on", {
                  date: new Intl.DateTimeFormat(locale).format(new Date(data.generatedAt)),
                })}`
              : null}
          </p>
        ) : null}
      </div>
    </div>
  );
}
