import { useMemo } from "react";
import { useTranslation } from "next-i18next";
import type {
  PublicationsAuthorPoint,
  PublicationsAuthors,
} from "../../types/PublicationsDashboard";
import PanelTable, { type PanelTableColumn } from "./PanelTable";

// Props do componente
type Props = {
  data?: PublicationsAuthors;
  loading: boolean;
  error: boolean;
};

// Função responsável por formatar um número em relação ao locale
function formatNumber(value: number, locale: string) {
  return new Intl.NumberFormat(locale).format(value);
}

export default function AuthorsProductionsTable({
  data,
  loading,
  error,
}: Props) {
  const { t } = useTranslation("common");
  const items = data?.items ?? [];

  const columns = useMemo<PanelTableColumn<PublicationsAuthorPoint>[]>(
    () => [
      {
        key: "rank",
        header: "#",
        accessor: (row) => row.rank,
        sortAs: "number",
      },
      {
        key: "author",
        header: t("Authors"),
        accessor: (row) => row.author,
        sortAs: "text",
        title: (row) => row.author,
      },
      {
        key: "count",
        header: t("Productions"),
        accessor: (row) => row.count,
        align: "right",
        sortAs: "number",
        format: (value, _row, locale) => formatNumber(Number(value), locale),
      },
    ],
    [t],
  );

  return (
    <PanelTable
      title={t("Authors")}
      caption={t("Authors productions in selected range")}
      items={items}
      columns={columns}
      getRowKey={(row) => `${row.rank}-${row.author}`}
      loading={loading}
      error={error}
      initialSortKey="count"
      initialSortDirection="desc"
      exportFilename="autores"
    />
  );
}
