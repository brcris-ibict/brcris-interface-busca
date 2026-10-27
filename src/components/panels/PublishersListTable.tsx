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
import type {
  PublishersListItem,
  PublishersListResponse,
} from "../../types/PeopleDashboard";
import PanelTable, { type PanelTableColumn } from "./PanelTable";

const PAGE_SIZE = SERVER_PAGE_DEFAULT_SIZE;

function buildUrl(page: number, pageSize: number, knownTotal?: number, search?: string) {
  const params = buildServerPageSearchParams({}, page, pageSize, knownTotal, { q: search });
  return withBasePath(`/api/dashboard/publishers-list?${params.toString()}`);
}

function toExportRows(
  items: PublishersListItem[],
  columns: PanelTableColumn<PublishersListItem>[],
) {
  return items.map((row) => {
    const record: Record<string, string | number> = {};
    columns.forEach((column) => {
      record[column.key] = column.accessor(row);
    });
    return record;
  });
}

function externalLink(href: string, label: string) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {label}
    </a>
  );
}

export default function PublishersListTable() {
  const { t, i18n } = useTranslation("common");
  const locale = i18n.language || "pt-BR";
  const { data, loading, error, get } = useRequest<PublishersListResponse>();
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

  const caption = t("Publishers listing caption", {
    totalLabel: totalItems.toLocaleString(locale),
    pageSize: PAGE_SIZE,
    pagesLabel: Math.max(1, Math.ceil(totalItems / PAGE_SIZE)).toLocaleString(locale),
  });

  const columns = useMemo<PanelTableColumn<PublishersListItem>[]>(
    () => [
      {
        key: "name",
        header: t("Name"),
        accessor: (row) => row.name || "—",
        title: (row) => row.name,
      },
      {
        key: "publications",
        header: t("Publications"),
        accessor: (row) => row.publications,
        align: "right",
        sortAs: "number",
        format: (value, _row, rowLocale) =>
          new Intl.NumberFormat(rowLocale).format(Number(value)),
      },
      {
        key: "mainAffiliation",
        header: t("Main affiliation"),
        accessor: (row) => row.mainAffiliation || "—",
        title: (row) => row.mainAffiliation,
      },
      {
        key: "majorArea",
        header: t("Major area"),
        accessor: (row) => row.majorArea || "—",
      },
      {
        key: "lattesId",
        header: t("Lattes"),
        accessor: (row) => row.lattesId || "—",
        format: (value, row) =>
          row.lattesId ? externalLink(`http://lattes.cnpq.br/${row.lattesId}`, String(value)) : value,
      },
      {
        key: "orcid",
        header: "ORCID",
        accessor: (row) => row.orcid || "—",
        format: (value, row) =>
          row.orcid ? externalLink(`https://orcid.org/${row.orcid}`, String(value)) : value,
      },
      {
        key: "lastPublication",
        header: t("Last publication"),
        accessor: (row) => row.lastPublication || "—",
        align: "right",
      },
      {
        key: "firstPublication",
        header: t("First publication"),
        accessor: (row) => row.firstPublication || "—",
        align: "right",
      },
    ],
    [t],
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

      if (!response.ok) {
        throw new Error("Falha ao exportar listagem de publicadores.");
      }

      const payload = (await response.json()) as PublishersListResponse;
      if (payload.total > 0) exportKnownTotal = payload.total;

      const batch = payload.items ?? [];
      if (batch.length === 0) break;

      rows.push(...toExportRows(batch, columns));

      if (rows.length >= (payload.total ?? 0) || batch.length < SERVER_EXPORT_PAGE_SIZE) break;

      exportPage += 1;
    }

    return rows.slice(0, SERVER_EXPORT_MAX_ROWS);
  }, [columns, search]);

  return (
    <PanelTable
      title={t("Publishers listing")}
      caption={caption}
      items={items}
      columns={columns}
      getRowKey={(row) => row.id}
      loading={loading}
      error={Boolean(error)}
      initialSortKey="name"
      initialSortDirection="asc"
      pageSize={PAGE_SIZE}
      paginationMode="server"
      page={page}
      totalItems={totalItems}
      maxNavigableItems={SERVER_RESULT_WINDOW}
      onPageChange={setPage}
      clientSort={false}
      exportFilename="listagem-publicadores"
      fetchExportRows={fetchExportRows}
      feedbackHeight={280}
      layout="listing"
      searchable
      searchMode="server"
      searchValue={search}
      onSearch={handleSearch}
      searchPlaceholder={t("Search by researcher name")}
    />
  );
}
