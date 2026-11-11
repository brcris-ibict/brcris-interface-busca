import { useMemo } from "react";
import { useTranslation } from "next-i18next";
import type { PeopleByAffiliationPoint } from "../../types/PeopleDashboard";
import PanelTable, { type PanelTableColumn } from "./PanelTable";

type Props = {
  data: PeopleByAffiliationPoint[];
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

export default function AffiliationDistributionTable({
  data,
  loading,
  error,
}: Props) {
  const { t } = useTranslation("common");

  const columns = useMemo<PanelTableColumn<PeopleByAffiliationPoint>[]>(
    () => [
      {
        key: "rank",
        header: "#",
        accessor: (row) => row.rank,
        sortAs: "number",
      },
      {
        key: "affiliation",
        header: t("Affiliation"),
        accessor: (row) => row.affiliation,
        sortAs: "text",
        title: (row) => row.affiliation,
      },
      {
        key: "count",
        header: t("Researchers"),
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
        format: (value, _row, locale) => `${formatShare(Number(value), locale)}%`,
      },
    ],
    [t],
  );

  return (
    <PanelTable
      title={t("Distribution of researchers by affiliations")}
      caption={t("Researchers distribution by affiliation")}
      items={data}
      columns={columns}
      getRowKey={(row) => `${row.rank}-${row.affiliation}`}
      loading={loading}
      error={error}
      initialSortKey="count"
      initialSortDirection="desc"
      pageSize={13}
      exportFilename="pesquisadores-por-afiliacao"
      searchable
      searchPlaceholder={t("Search by affiliation")}
    />
  );
}
