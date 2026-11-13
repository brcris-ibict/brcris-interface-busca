import { useTranslation } from "next-i18next";
import { Building2, FileCode, Hourglass, ShieldCheck, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { SoftwareSummary } from "../../types/SoftwareDashboard";
import BigNumber from "./BigNumber";
import type { BigNumberAccent } from "./BigNumber";

type Props = {
  summary?: SoftwareSummary;
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

export default function SoftwareBigNumbers({ summary, loading, error }: Props) {
  const { t, i18n } = useTranslation("common");
  const locale = i18n.language || "pt-BR";
  const formatNumber = (value: number, fractionDigits = 0) =>
    new Intl.NumberFormat(locale, { maximumFractionDigits: fractionDigits }).format(value);
  const total = summary?.total ?? 0;
  const median = summary?.medianConcessionDays ?? null;
  const avgCreators = summary?.avgCreatorsPerSoftware ?? null;

  const cards: {
    title: string;
    value: string;
    subtitle: string;
    icon: LucideIcon;
    accent: BigNumberAccent;
  }[] = [
    {
      title: t("Total software"),
      value: summary ? formatNumber(summary.total) : "—",
      subtitle: t("Software indexed in BrCris"),
      icon: FileCode,
      accent: "teal",
    },
    {
      title: t("Granted software"),
      value: summary ? formatShare(summary.granted, total, locale) : "—",
      subtitle: t("Granted software count", {
        value: summary ? formatNumber(summary.granted) : "—",
      }),
      icon: ShieldCheck,
      accent: "cyan",
    },
    {
      title: t("Median time to grant"),
      value:
        median !== null
          ? t("Median time to grant value", { value: formatNumber(median) })
          : "—",
      subtitle: t("Median time to grant caption"),
      icon: Hourglass,
      accent: "slate",
    },
    {
      title: t("Distinct developers"),
      value: summary ? formatNumber(summary.creators) : "—",
      subtitle:
        avgCreators !== null
          ? t("Average developers per software", { value: formatNumber(avgCreators, 1) })
          : t("Distinct developers caption"),
      icon: Users,
      accent: "deep",
    },
    {
      title: t("Funding institutions"),
      value: summary ? formatNumber(summary.funders) : "—",
      subtitle: t("Funding institutions share", {
        share: summary ? formatShare(summary.withFunding, total, locale) : "—",
      }),
      icon: Building2,
      accent: "teal",
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
