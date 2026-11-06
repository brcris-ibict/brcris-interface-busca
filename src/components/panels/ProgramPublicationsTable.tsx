import { useEffect, useMemo } from "react";
import { useTranslation } from "next-i18next";
import useRequest from "../../hooks/useRequest";
import { withBasePath } from "../../lib/basePath";
import type {
  ProgramPublicationsResponse,
  ProgramPublicationsRow,
} from "../../types/ProgramsDashboard";
import PanelTable, { type PanelTableColumn } from "./PanelTable";

export default function ProgramPublicationsTable() {
  const { t } = useTranslation("common");
  const { data, loading, error, get } = useRequest<ProgramPublicationsResponse>();

  useEffect(() => {
    get(withBasePath("/api/dashboard/program-publications"));
  }, [get]);

  const columns = useMemo<PanelTableColumn<ProgramPublicationsRow>[]>(
    () => [
      { key: "rank", header: "#", accessor: (row) => row.rank, sortAs: "number" },
      {
        key: "program",
        header: t("Program"),
        accessor: (row) => row.program,
        sortAs: "text",
        title: (row) => row.program,
      },
      {
        key: "institution",
        header: t("Institution"),
        accessor: (row) => row.institution,
        sortAs: "text",
        title: (row) => row.institution,
      },
      {
        key: "publications",
        header: t("Publications"),
        accessor: (row) => row.publications,
        align: "right",
        sortAs: "number",
        format: (value, _row, locale) => new Intl.NumberFormat(locale).format(Number(value)),
      },
    ],
    [t],
  );

  return (
    <PanelTable
      title={t("Publications by program")}
      caption={t("Publications by program caption")}
      items={data?.items ?? []}
      columns={columns}
      getRowKey={(row) => `${row.program}-${row.institution}`}
      loading={loading}
      error={Boolean(error)}
      initialSortKey="rank"
      initialSortDirection="asc"
      pageSize={10}
      exportFilename="publicacoes-por-programa"
      searchable
      searchPlaceholder={t("Search by program or institution")}
    />
  );
}
