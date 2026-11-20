import { useEffect, useMemo } from "react";
import { useTranslation } from "next-i18next";
import useRequest from "../../hooks/useRequest";
import { withBasePath } from "../../lib/basePath";
import type { PatentIpcPoint, PatentIpcResponse } from "../../types/PatentsDashboard";
import PanelTable, { type PanelTableColumn } from "./PanelTable";

function formatNumber(value: number, locale: string) {
  return new Intl.NumberFormat(locale).format(value);
}

export default function PatentsIpcTable() {
  const { t, i18n } = useTranslation("common");
  const { data, loading, error, get } = useRequest<PatentIpcResponse>();

  useEffect(() => {
    get(withBasePath("/api/dashboard/patents-ipc"));
  }, [get]);

  const locale = i18n.language || "pt-BR";
  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const withIpc = data?.withIpc ?? 0;
  const assignments = items.reduce((sum, item) => sum + item.count, 0);

  const columns = useMemo<PanelTableColumn<PatentIpcPoint>[]>(
    () => [
      {
        key: "rank",
        header: "#",
        accessor: (row) => row.rank,
        sortAs: "number",
      },
      {
        key: "code",
        header: t("IPC classification"),
        accessor: (row) => row.code,
        sortAs: "text",
        title: (row) => row.code,
      },
      {
        key: "count",
        header: t("Patents"),
        accessor: (row) => row.count,
        align: "right",
        sortAs: "number",
        format: (value) => formatNumber(Number(value), locale),
      },
    ],
    [locale, t],
  );

  const caption = t("IPC classification caption", {
    codes: formatNumber(items.length, locale),
    assignments: formatNumber(assignments, locale),
    withIpc: formatNumber(withIpc, locale),
    missing: formatNumber(Math.max(total - withIpc, 0), locale),
  });

  return (
    <PanelTable
      title={t("IPC classification")}
      caption={loading ? "" : caption}
      items={items}
      columns={columns}
      getRowKey={(row) => row.code}
      loading={loading}
      error={Boolean(error)}
      initialSortKey="count"
      initialSortDirection="desc"
      pageSize={12}
      exportFilename="classificacao-ipc"
      searchable
      searchKeys={["code"]}
      searchPlaceholder={t("Search placeholder ipc")}
    />
  );
}
