import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "next-i18next";
import useRequest from "../../hooks/useRequest";
import { withBasePath } from "../../lib/basePath";
import {
  SERVER_EXPORT_MAX_ROWS,
  SERVER_EXPORT_PAGE_SIZE,
  SERVER_PAGE_DEFAULT_SIZE,
  SERVER_RESULT_WINDOW,
  buildServerPageSearchParams,
} from "../../lib/serverPagination";
import type { PatentListItem, PatentListResponse } from "../../types/PatentsDashboard";
import PanelTable, { type PanelTableColumn } from "./PanelTable";

const PAGE_SIZE = SERVER_PAGE_DEFAULT_SIZE;

function buildUrl(page: number, pageSize: number, knownTotal?: number, search?: string) {
  const params = buildServerPageSearchParams({}, page, pageSize, knownTotal, { q: search });
  return withBasePath(`/api/dashboard/patents-list?${params.toString()}`);
}

function toExportRows(items: PatentListItem[], columns: PanelTableColumn<PatentListItem>[]) {
  return items.map((row) => {
    const record: Record<string, string | number> = {};
    columns.forEach((column) => {
      record[column.key] = column.accessor(row);
    });
    return record;
  });
}

export default function PatentsListTable() {
  const { t, i18n } = useTranslation("common");
  const locale = i18n.language || "pt-BR";
  const { data, loading, error, get } = useRequest<PatentListResponse>();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const knownTotalRef = useRef(0);

  const handleSearch = useCallback((term: string) => {
    knownTotalRef.current = 0;
    setPage(1);
    setSearch(term);
  }, []);

  useEffect(() => {
    const knownTotal = page > 1 && knownTotalRef.current > 0 ? knownTotalRef.current : undefined;
    get(buildUrl(page, PAGE_SIZE, knownTotal, search));
  }, [page, search, get]);

  const items = data?.items ?? [];
  const totalItems = data?.total ?? 0;

  if (data?.total && data.total > 0) {
    knownTotalRef.current = data.total;
  }

  const stageLabel = useCallback(
    (code: string) => {
      const key = `Patent kind ${code}`;
      const label = t(key);
      return label === key ? code : `${code} · ${label}`;
    },
    [t],
  );

  const columns = useMemo<PanelTableColumn<PatentListItem>[]>(
    () => [
      {
        key: "title",
        header: t("Title"),
        accessor: (row) => row.title,
        sortAs: "text",
        title: (row) => row.title,
        format: (_value, row) => <a href={withBasePath(`/patents/${row.id}`)}>{row.title}</a>,
      },
      {
        key: "inventors",
        header: t("Inventors"),
        accessor: (row) => row.inventors || "—",
        sortAs: "text",
        title: (row) => row.inventors,
      },
      {
        key: "depositDate",
        header: t("Deposit date"),
        accessor: (row) => row.depositDate || "—",
        sortAs: "text",
      },
      {
        key: "stage",
        header: t("Patent stage name"),
        accessor: (row) => (row.kindCodes.length > 0 ? row.kindCodes.map(stageLabel).join(", ") : "—"),
        sortAs: "text",
        title: (row) => row.kindCodes.join(", "),
      },
      {
        key: "ipc",
        header: t("IPC classification"),
        accessor: (row) => row.ipc || "—",
        sortAs: "text",
        title: (row) => row.ipc,
      },
      {
        key: "url",
        header: t("Espacenet"),
        accessor: (row) => row.url || "—",
        sortable: false,
        format: (value) => {
          const url = String(value);
          if (!url.startsWith("http")) return "—";
          return (
            <a href={url} target="_blank" rel="noreferrer">
              {t("Espacenet")}
            </a>
          );
        },
      },
    ],
    [stageLabel, t],
  );

  const fetchExportRows = useCallback(async () => {
    const rows: Record<string, string | number>[] = [];
    let exportPage = 1;
    let exportKnownTotal = 0;

    while (rows.length < SERVER_EXPORT_MAX_ROWS) {
      const response = await fetch(
        buildUrl(
          exportPage,
          SERVER_EXPORT_PAGE_SIZE,
          exportPage > 1 && exportKnownTotal > 0 ? exportKnownTotal : undefined,
          search,
        ),
        { cache: "no-store" },
      );
      if (!response.ok) throw new Error("Falha ao exportar listagem de patentes.");

      const payload = (await response.json()) as PatentListResponse;
      if (payload.total > 0) exportKnownTotal = payload.total;

      const batch = payload.items ?? [];
      if (batch.length === 0) break;

      rows.push(...toExportRows(batch, columns));
      if (rows.length >= payload.total || batch.length < SERVER_EXPORT_PAGE_SIZE) break;
      exportPage += 1;
    }

    return rows.slice(0, SERVER_EXPORT_MAX_ROWS);
  }, [columns, search]);

  const navigableItems = Math.min(totalItems, SERVER_RESULT_WINDOW);
  const pagesLabel = Math.max(1, Math.ceil(navigableItems / PAGE_SIZE));

  return (
    <PanelTable
      title={t("Patents listing")}
      caption={t("Patents listing caption", {
        totalLabel: totalItems.toLocaleString(locale),
        pageSize: PAGE_SIZE,
        pagesLabel: pagesLabel.toLocaleString(locale),
      })}
      items={items}
      columns={columns}
      getRowKey={(row) => row.id || row.title}
      loading={loading}
      error={Boolean(error)}
      initialSortKey="depositDate"
      initialSortDirection="desc"
      pageSize={PAGE_SIZE}
      paginationMode="server"
      page={page}
      totalItems={totalItems}
      maxNavigableItems={SERVER_RESULT_WINDOW}
      onPageChange={setPage}
      clientSort={false}
      exportFilename="listagem-patentes"
      fetchExportRows={fetchExportRows}
      feedbackHeight={280}
      layout="listing"
      searchable
      searchMode="server"
      searchValue={search}
      onSearch={handleSearch}
      searchPlaceholder={t("Search placeholder patents")}
    />
  );
}
