import { useTranslation } from "next-i18next";
import { Award, GraduationCap, Network } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ProgramsSummary } from "../../types/ProgramsDashboard";
import BigNumber from "./BigNumber";
import type { BigNumberAccent } from "./BigNumber";

type Props = {
  summary?: ProgramsSummary;
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

export default function ProgramsBigNumbers({ summary, loading, error }: Props) {
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
      title: t("Total graduate programs"),
      value: summary ? formatNumber(summary.total) : "—",
      subtitle: t("Graduate programs indexed in BrCris"),
      icon: GraduationCap,
      accent: "teal",
    },
    {
      title: t("Programs with doctorate"),
      value: summary ? formatShare(summary.withDoctorate, total, locale) : "—",
      subtitle: t("Programs with doctorate count", {
        value: summary ? formatNumber(summary.withDoctorate) : "—",
      }),
      icon: Award,
      accent: "cyan",
    },
    {
      title: t("Networked programs"),
      value: summary ? formatNumber(summary.networked) : "—",
      subtitle: t("Networked programs share", {
        share: summary ? formatShare(summary.networked, total, locale) : "—",
      }),
      icon: Network,
      accent: "slate",
    },
  ];

  return (
    <div className="row g-2 mb-3">
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
            loadingLabel={t("Loading dashboard data")}
          />
        </div>
      ))}
    </div>
  );
}
