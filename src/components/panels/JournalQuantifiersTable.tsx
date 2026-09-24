import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "next-i18next";
import useRequest from "../../hooks/useRequest";
import { withBasePath } from "../../lib/basePath";
import type {
  PublicationsDashboardFilters,
  PublicationsJournalQuantifierPoint,
  PublicationsJournalQuantifiers,
} from "../../types/PublicationsDashboard";
import PanelTable, { type PanelTableColumn } from "./PanelTable";

type Props = {
  filters: PublicationsDashboardFilters;
};

// Tamanho da página
const PAGE_SIZE = 10;

// Função auxiliar para formatar números
function formatNumber(value: number, locale: string) {
  return new Intl.NumberFormat(locale).format(value);
}

// Função auxiliar para construir a URL da API
function buildUrl(
  filters: PublicationsDashboardFilters,
  page: number,
  pageSize: number,
) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([field, value]) => {
    if (value) params.set(field, value);
  });

  params.set("page", String(page));
  params.set("pageSize", String(pageSize));

  return withBasePath(`/api/dashboard/journal-quantifiers?${params.toString()}`);
}

// Componente principal
export default function JournalQuantifiersTable({ filters }: Props) {
  // Obtém o tradutor
  const { t } = useTranslation("common");
  // Obtém os dados da API
  const { data, loading, error, get } = useRequest<PublicationsJournalQuantifiers>();
  // Estado para a página
  const [page, setPage] = useState(1);

  // Reseta a página quando os filtros mudam
  useEffect(() => {
    setPage(1);
  }, [
    filters.publicationDate,
    filters.type,
    filters.language,
    filters.institution,
  ]);

  // Obtém os dados da API quando filtros ou página mudam
  useEffect(() => {
    get(buildUrl(filters, page, PAGE_SIZE));
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
  // Obtém o total de itens
  const totalItems = data?.total ?? 0;
  // Obtém as colunas da tabela
  const columns = useMemo<PanelTableColumn<PublicationsJournalQuantifierPoint>[]>(
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
    />
  );
}
