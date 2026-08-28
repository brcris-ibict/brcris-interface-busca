import { useTranslation } from "next-i18next";
import type { PublicationsTopJournalsArticles } from "../../types/PublicationsDashboard";
import ChartFeedback from "./ChartFeedback";

type Props = {
  data?: PublicationsTopJournalsArticles;
  loading: boolean;
  error: boolean;
};

function formatNumber(value: number, locale: string) {
  return new Intl.NumberFormat(locale).format(value);
}

function formatShare(value: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  }).format(value);
}

export default function TopJournalsArticlesTable({
  data,
  loading,
  error,
}: Props) {
  const { t, i18n } = useTranslation("common");
  const locale = i18n.language || "pt-BR";
  const items = data?.items ?? [];
  const empty = !loading && !error && items.length === 0;

  return (
    <div className="brcris-chart-card brcris-panel-table">
        <div className="brcris-panel-table__header">
          <h3 className="brcris-chart-card__title">
            {t("Top 10 journals articles")}
          </h3>
          <p className="brcris-panel-table__caption">
            {t("Top journals in selected range")}
          </p>
        </div>

        <div className="brcris-panel-table__body" aria-busy={loading}>
          <ChartFeedback
            height={220}
            loading={loading}
            error={error}
            empty={empty}
          />

          {!loading && !error && !empty ? (
            <div className="brcris-panel-table__scroll">
              <table className="brcris-panel-table__table">
                <thead>
                  <tr>
                    <th scope="col">{t("Position")}</th>
                    <th scope="col">{t("Journal")}</th>
                    <th scope="col" className="is-numeric">
                      {t("Publications")}
                    </th>
                    <th scope="col" className="is-numeric">
                      {t("Participation")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={`${item.rank}-${item.journal}`}>
                      <td>{`${item.rank}º`}</td>
                      <td>{item.journal}</td>
                      <td className="is-numeric">
                        {formatNumber(item.count, locale)}
                      </td>
                      <td className="is-numeric">
                        {`${formatShare(item.share, locale)}%`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
    </div>
  );
}
