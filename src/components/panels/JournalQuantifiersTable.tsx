import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "next-i18next";
import useRequest from "../../hooks/useRequest";
import { withBasePath } from "../../lib/basePath";
import {
  SERVER_EXPORT_MAX_ROWS,
  SERVER_EXPORT_PAGE_SIZE,
  buildServerPageSearchParams,
} from "../../lib/serverPagination";
import type {
  PublicationsDashboardFilters,
  PublicationsJournalQuantifierPoint,
  PublicationsJournalQuantifiers,
} from "../../types/PublicationsDashboard";
import PanelTable, { type PanelTableColumn } from "./PanelTable";

type Props = {
  filters: PublicationsDashboardFilters;
};

const PAGE_SIZE = 17; // Número de itens por página

// Função auxiliar para formatar números
function formatNumber(value: number, locale: string) {
  return new Intl.NumberFormat(locale).format(value);
}

// Função auxiliar para construir a URL da API
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
  return withBasePath(`/api/dashboard/journal-quantifiers?${params.toString()}`);
}

// Mapeia itens da API para linhas de CSV
function toExportRows(
  items: PublicationsJournalQuantifierPoint[],
  columns: PanelTableColumn<PublicationsJournalQuantifierPoint>[],
) {
  return items.map((row) => {
    const record: Record<string, string | number> = {};
    columns.forEach((column) => {
      record[column.key] = column.accessor(row);
    });
    return record;
  });
}

// Componente principal
export default function JournalQuantifiersTable({ filters }: Props) {
  // Obtém o tradutor
  const { t } = useTranslation("common");
  // Obtém os dados da API
  const { data, loading, error, get } =
    useRequest<PublicationsJournalQuantifiers>();
  // Estado para a página
  const [page, setPage] = useState(1);
  // Total da última resposta com filtros atuais (evita cardinality a cada página)
  const knownTotalRef = useRef(0);

  // Reseta a página quando os filtros mudam
  useEffect(() => {
    setPage(1);
    knownTotalRef.current = 0;
  }, [
    filters.publicationDate,
    filters.type,
    filters.language,
    filters.institution,
  ]);

  // Obtém os dados da API quando filtros ou página mudam
  useEffect(() => {
    const knownTotal =
      page > 1 && knownTotalRef.current > 0
        ? knownTotalRef.current
        : undefined;
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

  // Obtém os itens
  const items = data?.items ?? [];
  // Obtém o total de itens (todas as páginas navegáveis)
  const totalItems = data?.total ?? 0;

  if (data?.total && data.total > 0) {
    knownTotalRef.current = data.total;
  }

  // Obtém as colunas da tabela
  const columns = useMemo<
    PanelTableColumn<PublicationsJournalQuantifierPoint>[]
  >(
    () => [
      {
        key: "rank",
        header: "#",
        accessor: (row) => row.rank,
        sortAs: "number",
      },
      {
        key: "title",
        header: t("Publication"),
        accessor: (row) => row.title,
        sortAs: "text",
        title: (row) => row.title,
      },
      {
        key: "publications",
        header: t("Publications"),
        accessor: (row) => row.publications,
        align: "right",
        sortAs: "number",
        format: (value, _row, locale) => formatNumber(Number(value), locale),
      },
      {
        key: "conferences",
        header: t("Conferences"),
        accessor: (row) => row.conferences,
        align: "right",
        sortAs: "number",
        format: (value, _row, locale) => formatNumber(Number(value), locale),
      },
      {
        key: "journals",
        header: t("Periodicals"),
        accessor: (row) => row.journals,
        align: "right",
        sortAs: "number",
        format: (value, _row, locale) => formatNumber(Number(value), locale),
      },
      {
        key: "authors",
        header: t("Authors"),
        accessor: (row) => row.authors,
        align: "right",
        sortAs: "number",
        format: (value, _row, locale) => formatNumber(Number(value), locale),
      },
      {
        key: "sponsors",
        header: t("Funding"),
        accessor: (row) => row.sponsors,
        align: "right",
        sortAs: "number",
        format: (value, _row, locale) => formatNumber(Number(value), locale),
      },
    ],
    [t],
  );

  // Export em lotes: não pede pageSize=total de uma vez
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
          exportPage > 1 && exportKnownTotal > 0
            ? exportKnownTotal
            : undefined,
        ),
        { cache: "no-store" },
      );

      if (!response.ok) {
        throw new Error("Falha ao exportar quantificadores.");
      }

      const payload = (await response.json()) as PublicationsJournalQuantifiers;
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
      title={t("Journal quantifiers")}
      caption={t("Journal quantifiers in selected range")}
      items={items}
      columns={columns}
      getRowKey={(row) => `${row.rank}-${row.title}`}
      loading={loading}
      error={Boolean(error)}
      initialSortKey="publications"
      initialSortDirection="desc"
      pageSize={PAGE_SIZE}
      paginationMode="server"
      page={page}
      totalItems={totalItems}
      onPageChange={setPage}
      clientSort={false}
      exportFilename="quantificadores-periodicos"
      fetchExportRows={fetchExportRows}
      layout="metrics-compact"
      feedbackHeight={420}
    />
  );
}
