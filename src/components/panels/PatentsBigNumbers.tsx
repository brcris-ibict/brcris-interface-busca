import { useTranslation } from "next-i18next";
import { Lightbulb } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { PatentsSummary } from "../../types/PatentsDashboard";
import BigNumber from "./BigNumber";
import type { BigNumberAccent } from "./BigNumber";

type Props = {
  summary?: PatentsSummary;
  loading: boolean;
  error: boolean;
};

export default function PatentsBigNumbers({ summary, loading, error }: Props) {
  const { t, i18n } = useTranslation("common");
  const locale = i18n.language || "pt-BR";
  const formatNumber = (value: number) => new Intl.NumberFormat(locale).format(value);

  const cards: {
    title: string;
    value: string;
    subtitle: string;
    icon: LucideIcon;
    accent: BigNumberAccent;
  }[] = [
    {
      title: t("Total patents"),
      value: summary ? formatNumber(summary.total) : "—",
      subtitle: t("Patents indexed in BrCris"),
      icon: Lightbulb,
      accent: "teal",
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
