import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "next-i18next";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PublicationsTopJournalsArticles } from "../../types/PublicationsDashboard";
import ChartFeedback from "./ChartFeedback";

// Props do componente
type Props = {
  data?: PublicationsTopJournalsArticles;
  loading: boolean;
  error: boolean;
};

// Tamanho da página
const PAGE_SIZE = 10;

// Função responsável por formatar um número em relação ao locale
function formatNumber(value: number, locale: string) {
  return new Intl.NumberFormat(locale).format(value);
}

// Função responsável por formatar um número em relação ao locale
function formatShare(value: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  }).format(value);
}

// Componente principal
export default function TopJournalsArticlesTable({
  data,
  loading,
  error,
}: Props) {
  const { t, i18n } = useTranslation("common");
  const locale = i18n.language || "pt-BR";
  const items = data?.items ?? [];
  const empty = !loading && !error && items.length === 0;
  const [page, setPage] = useState(1);

  // Atualiza a página quando os dados mudam
  useEffect(() => {
    setPage(1);
  }, [data?.items]);

  // Calcula o total de páginas
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));

  // Retorna os itens da página atual
  const pageItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;

    return items.slice(start, start + PAGE_SIZE);

  }, [items, page]);

  // Calcula os números das páginas
  const pageNumbers = useMemo(() => {
    const windowSize = 5;
    const start = Math.max(1, Math.min(page - 2, totalPages - windowSize + 1));
    const end = Math.min(totalPages, start + windowSize - 1);
    
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);

  }, [page, totalPages]);

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
          <>
            <div className="brcris-panel-table__scroll">
              <table className="brcris-panel-table__table">
                <thead>
                  <tr>
                    <th scope="col">{t("Position")}</th>
                    <th scope="col">{t("Publication vehicle")}</th>
                    <th scope="col" className="is-numeric">
                      {t("Productions")}
                    </th>
                    <th scope="col" className="is-numeric">
                      {t("Participation")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((item) => (
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

            {totalPages > 1 ? (
              <div className="brcris-panel-table__pagination" role="navigation">
                <button
                  type="button"
                  className="brcris-panel-table__page-btn"
                  disabled={page <= 1}
                  aria-label={t("Previous page")}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  <ChevronLeft size={16} />
                </button>

                {pageNumbers[0] > 1 ? (
                  <>
                    <button
                      type="button"
                      className="brcris-panel-table__page-btn"
                      onClick={() => setPage(1)}
                    >
                      1
                    </button>
                    {pageNumbers[0] > 2 ? (
                      <span className="brcris-panel-table__page-ellipsis">
                        …
                      </span>
                    ) : null}
                  </>
                ) : null}

                {pageNumbers.map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={
                      n === page
                        ? "brcris-panel-table__page-btn is-active"
                        : "brcris-panel-table__page-btn"
                    }
                    aria-current={n === page ? "page" : undefined}
                    onClick={() => setPage(n)}
                  >
                    {n}
                  </button>
                ))}

                {pageNumbers[pageNumbers.length - 1] < totalPages ? (
                  <>
                    {pageNumbers[pageNumbers.length - 1] < totalPages - 1 ? (
                      <span className="brcris-panel-table__page-ellipsis">
                        …
                      </span>
                    ) : null}
                    <button
                      type="button"
                      className="brcris-panel-table__page-btn"
                      onClick={() => setPage(totalPages)}
                    >
                      {totalPages}
                    </button>
                  </>
                ) : null}

                <button
                  type="button"
                  className="brcris-panel-table__page-btn"
                  disabled={page >= totalPages}
                  aria-label={t("Next page")}
                  onClick={() =>
                    setPage((current) => Math.min(totalPages, current + 1))
                  }
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
