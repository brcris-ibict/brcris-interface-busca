import { useMemo } from "react";
import { useTranslation } from "next-i18next";
import type {
  PublicationsTopJournalPoint,
  PublicationsTopJournalsArticles,
} from "../../types/PublicationsDashboard";
import PanelTable, { type PanelTableColumn } from "./PanelTable";

// Props do componente
type Props = {
  data?: PublicationsTopJournalsArticles;
  loading: boolean;
  error: boolean;
};

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

export default function TopJournalsArticlesTable({
  data,
  loading,
  error,
}: Props) {
  const { t } = useTranslation("common");
  const items = data?.items ?? [];

  const columns = useMemo<PanelTableColumn<PublicationsTopJournalPoint>[]>(
    () => [
      {
        key: "rank",
        header: "#",
        accessor: (row) => row.rank,
        sortAs: "number",
      },
      {
        key: "journal",
        header: t("Publication vehicle"),
        accessor: (row) => row.journal,
        sortAs: "text",
        title: (row) => row.journal,
      },
      {
        key: "count",
        header: t("Productions"),
        accessor: (row) => row.count,
        align: "right",
        sortAs: "number",
        format: (value, _row, locale) => formatNumber(Number(value), locale),
      },
      {
        key: "share",
        header: t("Participation"),
        accessor: (row) => row.share,
        align: "right",
        sortAs: "number",
        format: (value, _row, locale) =>
          `${formatShare(Number(value), locale)}%`,
      },
    ],
    [t],
  );

  return (
    <PanelTable
      title={t("Top 10 journals articles")}
      caption={t("Top journals in selected range")}
      items={items}
      columns={columns}
      getRowKey={(row) => `${row.rank}-${row.journal}`}
      loading={loading}
      error={error}
      initialSortKey="count"
      initialSortDirection="desc"
      exportFilename="veiculos-de-publicacao"
    />
  );
}
