import { useEffect, useMemo } from "react";
import { useTranslation } from "next-i18next";
import useRequest from "../../hooks/useRequest";
import { withBasePath } from "../../lib/basePath";
import type { ProgramListResponse, ProgramListRow } from "../../types/ProgramsDashboard";
import PanelTable, { type PanelTableColumn } from "./PanelTable";

export default function ProgramListTable() {
  const { t } = useTranslation("common");
  const { data, loading, error, get } = useRequest<ProgramListResponse>();

  useEffect(() => {
    get(withBasePath("/api/dashboard/program-list"));
  }, [get]);

  const columns = useMemo<PanelTableColumn<ProgramListRow>[]>(
    () => [
      { key: "rank", header: "#", accessor: (row) => row.rank, sortAs: "number" },
      {
        key: "name",
        header: t("Name"),
        accessor: (row) => row.name,
        sortAs: "text",
        title: (row) => row.name,
      },
      {
        key: "institution",
        header: t("Institution"),
        accessor: (row) => row.institution || "—",
        sortAs: "text",
        title: (row) => row.institution,
      },
      {
        key: "link",
        header: t("BrCris link"),
        accessor: (row) => row.id,
        sortable: false,
        format: (value) => (
          <a href={withBasePath(`/programs/${value}`)} target="_blank" rel="noopener noreferrer">
            {t("View in BrCris")}
          </a>
        ),
      },
    ],
    [t],
  );

  return (
    <PanelTable
      title={t("Programs list")}
      caption={t("Programs list caption")}
      items={data?.items ?? []}
      columns={columns}
      getRowKey={(row) => `${row.id}-${row.institution}`}
      loading={loading}
      error={Boolean(error)}
      initialSortKey="rank"
      initialSortDirection="asc"
      pageSize={10}
      exportFilename="lista-de-programas"
      searchable
      searchKeys={["name", "institution"]}
      searchPlaceholder={t("Search by program or institution")}
    />
  );
}
