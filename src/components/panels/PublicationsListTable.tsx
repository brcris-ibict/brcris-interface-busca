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
  PublicationsDashboardFilters,
  PublicationsListItem,
  PublicationsListResponse,
} from "../../types/PublicationsDashboard";
import PanelTable, { type PanelTableColumn } from "./PanelTable";

type Props = {
  filters: PublicationsDashboardFilters;
};

const PAGE_SIZE = SERVER_PAGE_DEFAULT_SIZE;

// Função auxiliar para construir a URL da API de listagem de publicações
function buildUrl(
  filters: PublicationsDashboardFilters,
  page: number,
  pageSize: number,
  knownTotal?: number,
) {
  const params = buildServerPageSearchParams(
    filters,
    page,
    pageSize,
    knownTotal,
  );
  return withBasePath(`/api/dashboard/publication-list?${params.toString()}`);
}

// Função auxiliar para converter os itens para o formato de exportação
function toExportRows(
  items: PublicationsListItem[],
  columns: PanelTableColumn<PublicationsListItem>[],
) {
  return items.map((row) => {
    const record: Record<string, string | number> = {};
    columns.forEach((column) => {
      record[column.key] = column.accessor(row);
    });
    return record;
  });
}

// Componente para exibir a tabela de listagem de publicações
export default function PublicationsListTable({ filters }: Props) {
  const { t, i18n } = useTranslation("common");
  const locale = i18n.language || "pt-BR";
  const { data, loading, error, get } = useRequest<PublicationsListResponse>();
  const [page, setPage] = useState(1);
  const knownTotalRef = useRef(0);

  // Efeito para reiniciar a página e o total conhecido quando os filtros mudam
  useEffect(() => {
    setPage(1);
    knownTotalRef.current = 0;
  }, [
    filters.publicationDate,
    filters.type,
    filters.language,
    filters.institution,
  ]);

  // Efeito para obter os itens da página atual
  useEffect(() => {
    const knownTotal = page > 1 && knownTotalRef.current > 0 ? knownTotalRef.current : undefined;
    get(buildUrl(filters, page, PAGE_SIZE, knownTotal));

  }, [
    filters.publicationDate,
    filters.type,
    filters.language,
    filters.institution,
    page,
    get,
    filters,
  ]);

  const items = data?.items ?? [];
  const totalItems = data?.total ?? 0;

  if (data?.total && data.total > 0) {
    knownTotalRef.current = data.total;
  }

  // Total de páginas
  const totalPagesLabel = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

  // Caption da tabela
  const caption = t("Publications listing caption", {
    totalLabel: totalItems.toLocaleString(locale),
    pageSize: PAGE_SIZE,
    pagesLabel: totalPagesLabel.toLocaleString(locale),
  });

  // Colunas da tabela
  const columns = useMemo<PanelTableColumn<PublicationsListItem>[]>(
    () => [
      {
        key: "title",
        header: t("Title"),
        accessor: (row) => row.title,
        sortAs: "text",
        title: (row) => row.title,
      },
      {
        key: "authors",
        header: t("Authors"),
        accessor: (row) => row.authors,
        sortAs: "text",
        title: (row) => row.authors,
      },
      {
        key: "journal",
        header: t("Journal"),
        accessor: (row) => row.journal,
        sortAs: "text",
      },
      {
        key: "conference",
        header: t("Conference"),
        accessor: (row) => row.conference,
        sortAs: "text",
      },
      {
        key: "doi",
        header: t("DOI"),
        accessor: (row) => row.doi,
        sortAs: "text",
      },
      {
        key: "accessType",
        header: t("Access type"),
        accessor: (row) => row.accessType,
        sortAs: "text",
      },
      {
        key: "funding",
        header: t("Funding"),
        accessor: (row) => row.funding,
        sortAs: "text",
        title: (row) => row.funding,
      },
    ],
    [t],
  );

  // Função auxiliar para buscar as linhas para o export
  const fetchExportRows = useCallback(async () => {
    const rows: Record<string, string | number>[] = [];
    let exportPage = 1;
    let exportKnownTotal = 0;

    while (rows.length < SERVER_EXPORT_MAX_ROWS) {
      const response = await fetch(
        buildUrl(
          filters,
          exportPage,
          SERVER_EXPORT_PAGE_SIZE,
          exportPage > 1 && exportKnownTotal > 0 ? exportKnownTotal : undefined,
        ),
        { cache: "no-store" },
      ); // Faz a requisição para a API de listagem de publicações

      // Verifica se a resposta é ok
      if (!response.ok) {
        throw new Error("Falha ao exportar listagem de publicacoes.");
      }

      const payload = (await response.json()) as PublicationsListResponse;
      if (payload.total > 0) exportKnownTotal = payload.total;

      const batch = payload.items ?? [];
      if (batch.length === 0) break;

      rows.push(...toExportRows(batch, columns));

      const reachedTotal = rows.length >= (payload.total ?? 0);
      const shortPage = batch.length < SERVER_EXPORT_PAGE_SIZE;
      if (reachedTotal || shortPage) break;

      exportPage += 1;
    }

    return rows.slice(0, SERVER_EXPORT_MAX_ROWS);
  }, [filters, columns]);

  return (
    <PanelTable
      title={t("Publications listing")}
      caption={caption}
      items={items}
      columns={columns}
      getRowKey={(row) => row.id || `${row.doi}-${row.title}`}
      loading={loading}
      error={Boolean(error)}
      initialSortKey="title"
      initialSortDirection="asc"
      pageSize={PAGE_SIZE}
      paginationMode="server"
      page={page}
      totalItems={totalItems}
      maxNavigableItems={SERVER_RESULT_WINDOW}
      onPageChange={setPage}
      clientSort={false}
      exportFilename="listagem-publicacoes"
      fetchExportRows={fetchExportRows}
      feedbackHeight={280}
      layout="listing"
    />
  );
}
