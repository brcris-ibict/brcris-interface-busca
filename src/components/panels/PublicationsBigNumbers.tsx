import { useTranslation } from "next-i18next";
import { Building2, CalendarDays, FileText, Layers3 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { PublicationsDashboardSummary } from "../../types/PublicationsDashboard";
import BigNumber from "./BigNumber";
import type { BigNumberAccent } from "./BigNumber";

type Props = {
  summary?: PublicationsDashboardSummary;
  loading: boolean;
  error: boolean;
};

function formatNumber(value: number, locale: string) {
  return new Intl.NumberFormat(locale).format(value);

}

function formatPercent(value: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);

}

export default function PublicationsBigNumbers({ summary, loading, error }: Props) {
  const { t, i18n } = useTranslation("common");
  const locale = i18n.language || "pt-BR";
  const loadingLabel = t("Loading dashboard data");

  const cards: {
    title: string;
    value: string;
    subtitle: string;
    icon: LucideIcon;
    accent: BigNumberAccent;
  }[] = [
    {
      title: t("Total publications"),
      value: summary ? formatNumber(summary.total, locale) : "—",
      subtitle: t("In selected range"),
      icon: FileText,
      accent: "teal",
    },
    {
      title: summary?.lastYear ? t("Publications in year", { year: summary.lastYear }) : t("Publications in year", { year: "—" }),
      value: summary ? formatNumber(summary.lastYearCount, locale) : "—",
      subtitle: t("Last year in range"),
      icon: CalendarDays,
      accent: "cyan",
    },
    {
      title: t("Institutions represented"),
      value: summary ? formatNumber(summary.institutionsCount, locale) : "—",
      subtitle: t("Associated institutions count"),
      icon: Building2,
      accent: "slate",
    },
    {
      title: t("Predominant type"),
      value: summary?.predominantType || "—",
      subtitle: summary ? t("Share of publications", {
            share: formatPercent(summary.predominantTypeShare, locale),
          }) : t("Share of publications", { share: "—" }),
      icon: Layers3,
      accent: "deep",
    },
  ];

  return (
    <div className="row g-3 mb-3">
      {cards.map((card) => (
        <div key={card.title} className="col-12 col-sm-6 col-xl-3">
          <BigNumber
            title={card.title}
            value={card.value}
            subtitle={card.subtitle}
            icon={card.icon}
            accent={card.accent}
            loading={loading}
            error={error}
            loadingLabel={loadingLabel}
          />
        </div>
      ))}
    </div>
  );
}
