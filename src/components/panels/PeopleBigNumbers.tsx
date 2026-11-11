import { useTranslation } from "next-i18next";
import { BadgeCheck, Building2, FileText, Network, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { PeopleDashboardSummary } from "../../types/PeopleDashboard";
import BigNumber from "./BigNumber";
import type { BigNumberAccent } from "./BigNumber";

type Props = {
  summary?: PeopleDashboardSummary;
  loading: boolean;
  error: boolean;
};

function formatNumber(value: number, locale: string) {
  return new Intl.NumberFormat(locale).format(value);
}

function formatShare(part: number, total: number, locale: string) {
  if (total <= 0) return "—";
  return `${new Intl.NumberFormat(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format((part / total) * 100)}%`;
}

export default function PeopleBigNumbers({ summary, loading, error }: Props) {
  const { t, i18n } = useTranslation("common");
  const locale = i18n.language || "pt-BR";
  const loadingLabel = t("Loading dashboard data");
  const total = summary?.total ?? 0;

  const cards: {
    title: string;
    value: string;
    subtitle: string;
    icon: LucideIcon;
    accent: BigNumberAccent;
  }[] = [
    {
      title: t("Total researchers"),
      value: summary ? formatNumber(summary.total, locale) : "—",
      subtitle: t("Researchers indexed in BrCris"),
      icon: Users,
      accent: "teal",
    },
    {
      title: t("Researchers with ORCID"),
      value: summary ? formatShare(summary.withOrcid, total, locale) : "—",
      subtitle: t("Researchers with ORCID count", {
        value: summary ? formatNumber(summary.withOrcid, locale) : "—",
      }),
      icon: BadgeCheck,
      accent: "cyan",
    },
    {
      title: t("Researchers with publications"),
      value: summary ? formatShare(summary.withPublications, total, locale) : "—",
      subtitle: t("Researchers with publications count", {
        value: summary ? formatNumber(summary.withPublications, locale) : "—",
      }),
      icon: FileText,
      accent: "slate",
    },
    {
      title: t("Institutions represented"),
      value: summary ? formatNumber(summary.institutionsCount, locale) : "—",
      subtitle: t("Distinct affiliations"),
      icon: Building2,
      accent: "deep",
    },
    {
      title: t("Researchers in research groups"),
      value: summary ? formatShare(summary.inResearchGroup, total, locale) : "—",
      subtitle: t("Research group members and leaders", {
        members: summary ? formatNumber(summary.inResearchGroup, locale) : "—",
        leaders: summary ? formatNumber(summary.groupLeaders, locale) : "—",
      }),
      icon: Network,
      accent: "teal",
    },
  ];

  return (
    <div className="row row-cols-xl-5 g-2 mb-3">
      {cards.map((card) => (
        <div key={card.title} className="col-12 col-sm-6 col-lg-4">
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
