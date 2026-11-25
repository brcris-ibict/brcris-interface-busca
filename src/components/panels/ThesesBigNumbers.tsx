import { useTranslation } from "next-i18next";
import { BookOpenText, Building2, GraduationCap, Newspaper, ScrollText } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ThesesSummary } from "../../types/ThesesDashboard";
import BigNumber from "./BigNumber";
import type { BigNumberAccent } from "./BigNumber";

type Props = {
  summary?: ThesesSummary;
  loading: boolean;
  error: boolean;
};

function formatShare(part: number, total: number, locale: string) {
  if (total <= 0) return "—";
  return `${new Intl.NumberFormat(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format((part / total) * 100)}%`;
}

export default function ThesesBigNumbers({ summary, loading, error }: Props) {
  const { t, i18n } = useTranslation("common");
  const locale = i18n.language || "pt-BR";
  const formatNumber = (value: number) => new Intl.NumberFormat(locale).format(value);
  const total = summary?.total ?? 0;

  const cards: {
    title: string;
    value: string;
    subtitle: string;
    icon: LucideIcon;
    accent: BigNumberAccent;
  }[] = [
    {
      title: t("Total theses and dissertations"),
      value: summary ? formatNumber(summary.total) : "—",
      subtitle: t("Theses indexed in BrCris"),
      icon: BookOpenText,
      accent: "teal",
    },
    {
      title: t("Dissertations"),
      value: summary ? formatNumber(summary.dissertations) : "—",
      subtitle: t("Share of theses and dissertations", {
        share: summary ? formatShare(summary.dissertations, total, locale) : "—",
      }),
      icon: ScrollText,
      accent: "cyan",
    },
    {
      title: t("Doctoral theses"),
      value: summary ? formatNumber(summary.theses) : "—",
      subtitle: t("Share of theses and dissertations", {
        share: summary ? formatShare(summary.theses, total, locale) : "—",
      }),
      icon: GraduationCap,
      accent: "slate",
    },
    {
      title: t("Articles"),
      value: summary ? formatNumber(summary.articles) : "—",
      subtitle: t("Articles indexed in BrCris"),
      icon: Newspaper,
      accent: "teal",
    },
    {
      title: t("Titling institutions"),
      value: summary ? formatNumber(summary.institutions) : "—",
      subtitle: t("Titling institutions caption"),
      icon: Building2,
      accent: "deep",
    },
  ];

  return (
    <div className="row g-2 mb-3">
      {cards.map((card) => (
        <div key={card.title} className="col-12 col-sm-6 col-lg-4 col-xl">
          <BigNumber
            title={card.title}
            value={card.value}
            subtitle={card.subtitle}
            icon={card.icon}
            accent={card.accent}
            loading={loading}
            error={error}
            loadingLabel={t("Loading dashboard data")}
          />
        </div>
      ))}
    </div>
  );
}
