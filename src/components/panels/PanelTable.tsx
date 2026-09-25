import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "next-i18next";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import ChartExportMenu from "./ChartExportMenu";
import ChartFeedback from "./ChartFeedback";

// Tipos de ordenação
export type PanelTableSortDirection = "asc" | "desc";

// Atributos de uma coluna da tabela
export type PanelTableColumn<T> = {
  key: string;
  header: string;
  accessor: (row: T) => string | number;
  align?: "left" | "right";
  sortable?: boolean;
  sortAs?: "text" | "number";
  format?: (value: string | number, row: T, locale: string) => ReactNode;
  title?: (row: T) => string;
};

// Props do componente
type Props<T> = {
  title: string; // Título da tabela
  caption: string; // Descrição da tabela
  items: T[]; // Itens da tabela
  columns: PanelTableColumn<T>[]; // Colunas da tabela
  getRowKey: (row: T) => string; // Função para obter a chave de uma linha
  loading: boolean; // Se true, a tabela está carregando
  error: boolean; // Se true, a tabela está com erro
  initialSortKey: string; // Chave da coluna para a ordenação inicial
  initialSortDirection?: PanelTableSortDirection; // Direção da ordenação inicial
  pageSize?: number; // Tamanho da página
  feedbackHeight?: number; // Altura do feedback (ex.: 220px)
  layout?: "metrics" | "metrics-compact" | "listing"; // Layout da tabela: "metrics" / "metrics-compact" / "listing"
  paginationMode?: "client" | "server"; // Modo de paginação: "client" para paginação no cliente, "server" para paginação no servidor
  page?: number; // Página atual
  totalItems?: number; // Total de itens
  maxNavigableItems?: number; // Máx. de itens navegáveis com from/size (ex.: 10000). Afeta só o salto de página.
  onPageChange?: (page: number) => void; // Função para mudar a página
  clientSort?: boolean; // Se true, a ordenação é feita no cliente (ex.: na interface do usuário)
  exportFilename?: string; // Nome do arquivo para o export
  fetchExportRows?: () => Promise<Record<string, string | number>[]>; // Tabela server-paginated: busca todas as linhas no export (não só a página)
};

// Função responsável por comparar dois valores em relação à direção de ordenação
function compareValues(
  left: string | number,
  right: string | number,
  direction: PanelTableSortDirection,
) {
  const result =
    typeof left === "number" && typeof right === "number"
      ? left - right
      : String(left).localeCompare(String(right), undefined, {
          sensitivity: "base",
          numeric: true,
        });

  return direction === "asc" ? result : -result;
}

// Componente principal da tabela
export default function PanelTable<T>({
  title,
  caption,
  items,
  columns,
  getRowKey,
  loading,
  error,
  initialSortKey,
  initialSortDirection = "desc",
  pageSize = 10,
  feedbackHeight = 220,
  layout = "metrics",
  paginationMode = "client",
  page: controlledPage,
  totalItems,
  maxNavigableItems,
  onPageChange,
  clientSort = true,
  exportFilename,
  fetchExportRows,
}: Props<T>) {
  const { t, i18n } = useTranslation("common"); // Idioma da aplicação
  const locale = i18n.language || "pt-BR"; // Idioma da aplicação
  const empty = !loading && !error && items.length === 0; 
  const isServer = paginationMode === "server"; // Verifica se a paginação é no servidor

  const [internalPage, setInternalPage] = useState(1); // Página interna
  const [sortKey, setSortKey] = useState(initialSortKey);
  const [sortDirection, setSortDirection] = useState<PanelTableSortDirection>(initialSortDirection);

  const page = isServer ? (controlledPage ?? 1) : internalPage; // Página atual

  // Efeito para reiniciar a página interna quando os itens ou os critérios de ordenação mudam
  useEffect(() => {
    if (!isServer) {
      setInternalPage(1); // Reinicia a página interna para 1
    }

    setSortKey(initialSortKey);
    setSortDirection(initialSortDirection);

  }, [items, initialSortKey, initialSortDirection, isServer]);

  // Efeito para ordenar os itens quando os critérios de ordenação mudam
  const sortedItems = useMemo(() => {
    if (!clientSort) return items;

    const column = columns.find((item) => item.key === sortKey);
    if (!column) return items;

    const next = [...items];
    next.sort((a, b) =>
      compareValues(column.accessor(a), column.accessor(b), sortDirection),
    );

    return next;
  }, [items, columns, sortKey, sortDirection, clientSort]);

  // Efeito para obter as colunas para o export
  const exportColumns = useMemo(
    () =>
      columns.map((column) => ({
        key: column.key,
        header: column.header,
      })),
    [columns],
  );

  // Efeito para obter as linhas para o export
  const exportRows = useMemo(
    () =>
      sortedItems.map((row) => {
        const record: Record<string, string | number> = {};
        columns.forEach((column) => {
          record[column.key] = column.accessor(row);
        });
        return record;
      }),
    [sortedItems, columns],
  );

  // Total efetivo para navegação (respeita janela from/size do ES, se informada)
  const effectiveTotal = Math.max(
    0,
    maxNavigableItems != null
      ? Math.min(totalItems ?? items.length, maxNavigableItems)
      : isServer ? (totalItems ?? items.length) : sortedItems.length, // Se estiver no modo server, usa o total de itens, se não, usa o total de itens ordenados
  );

  // Efeito para obter o total de páginas
  const totalPages = Math.max(1, Math.ceil(effectiveTotal / pageSize));

  // Efeito para obter os itens da página atual
  const pageItems = useMemo(() => {
    if (isServer) return sortedItems;

    const start = (page - 1) * pageSize;

    return sortedItems.slice(start, start + pageSize);

  }, [sortedItems, page, pageSize, isServer]);

  // Obtém os números das páginas
  const pageNumbers = useMemo(() => {
    // Tamanho da janela
    const windowSize = 5;
    // Início da janela
    const start = Math.max(1, Math.min(page - 2, totalPages - windowSize + 1));
    // Fim da janela
    const end = Math.min(totalPages, start + windowSize - 1);

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [page, totalPages]);

  // Função auxiliar para ir para uma página
  function goToPage(next: number) {
    // Se estiver no modo server, chama a função de mudança de página
    if (isServer) {
      onPageChange?.(next);
      return;
    }
    setInternalPage(next);
  }

  function handleSort(column: PanelTableColumn<T>) {
    // Se não estiver no modo client ou a coluna não for sortável, retorna
    if (!clientSort || column.sortable === false) return;

    if (!isServer) {
      setInternalPage(1);
    }

    if (sortKey === column.key) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(column.key);
    setSortDirection(column.sortAs === "text" ? "asc" : "desc");
  }

  function sortIcon(key: string) {
    if (sortKey !== key) return <ArrowUpDown size={12} aria-hidden />;
    return sortDirection === "asc" ? (
      <ArrowUp size={12} aria-hidden />
    ) : (
      <ArrowDown size={12} aria-hidden />
    );
  }

  return (
    <div className="brcris-chart-card brcris-panel-table">
      <div className="brcris-panel-table__header">
        <div className="brcris-panel-table__heading">
          <h3 className="brcris-chart-card__title">{title}</h3>
          <p className="brcris-panel-table__caption">{caption}</p>
        </div>

        {exportFilename ? (
          <div className="brcris-chart-card__toggles" role="group">
            <ChartExportMenu
              filename={exportFilename}
              columns={exportColumns}
              rows={exportRows}
              onExportCsv={fetchExportRows}
              disabled={loading || error || items.length === 0}
            />
          </div>
        ) : null}
      </div>

      <div className="brcris-panel-table__body" aria-busy={loading}>
        <ChartFeedback
          height={feedbackHeight}
          loading={loading}
          error={error}
          empty={empty}
        />

        {!loading && !error && !empty ? (
          <>
            <div className="brcris-panel-table__scroll">
              <table
                className={
                  layout === "listing"
                    ? "brcris-panel-table__table is-listing"
                    : layout === "metrics-compact"
                      ? "brcris-panel-table__table is-metrics-compact"
                      : "brcris-panel-table__table"
                }
              >
                <thead>
                  <tr>
                    {columns.map((column) => {
                      const active = sortKey === column.key;
                      const ariaSort =
                        !clientSort || column.sortable === false
                          ? undefined
                          : active
                            ? sortDirection === "asc"
                              ? "ascending"
                              : "descending"
                            : "none";
                      const className =
                        column.align === "right" ? "is-numeric" : undefined;

                      if (!clientSort || column.sortable === false) {
                        return (
                          <th
                            key={column.key}
                            scope="col"
                            className={className}
                          >
                            {column.header}
                          </th>
                        );
                      }

                      return (
                        <th
                          key={column.key}
                          scope="col"
                          className={className}
                          aria-sort={ariaSort}
                        >
                          <button
                            type="button"
                            className={
                              active
                                ? "brcris-panel-table__sort-btn is-active"
                                : "brcris-panel-table__sort-btn"
                            }
                            onClick={() => handleSort(column)}
                            aria-label={t("Sort by column", {
                              column: column.header,
                            })}
                          >
                            <span>{column.header}</span>
                            {sortIcon(column.key)}
                          </button>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((row) => (
                    <tr key={getRowKey(row)}>
                      {columns.map((column) => {
                        const value = column.accessor(row);
                        const className =
                          column.align === "right" ? "is-numeric" : undefined;
                        const content = column.format
                          ? column.format(value, row, locale)
                          : value;
                        const cellTitle = column.title
                          ? column.title(row)
                          : undefined;

                        return (
                          <td
                            key={column.key}
                            className={className}
                            title={cellTitle}
                          >
                            {content}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 ? (
              <div className="brcris-panel-table__pagination" role="navigation">
                <button
                  type="button"
                  className="brcris-panel-table__page-btn"
                  disabled={page <= 1}
                  aria-label={t("Previous page")}
                  onClick={() => goToPage(Math.max(1, page - 1))}
                >
                  <ChevronLeft size={16} />
                </button>

                {pageNumbers[0] > 1 ? (
                  <>
                    <button
                      type="button"
                      className="brcris-panel-table__page-btn"
                      onClick={() => goToPage(1)}
                    >
                      1
                    </button>
                    {pageNumbers[0] > 2 ? (
                      <span className="brcris-panel-table__page-ellipsis">
                        …
                      </span>
                    ) : null}
                  </>
                ) : null}

                {pageNumbers.map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={
                      n === page
                        ? "brcris-panel-table__page-btn is-active"
                        : "brcris-panel-table__page-btn"
                    }
                    aria-current={n === page ? "page" : undefined}
                    onClick={() => goToPage(n)}
                  >
                    {n}
                  </button>
                ))}

                {pageNumbers[pageNumbers.length - 1] < totalPages ? (
                  <>
                    {pageNumbers[pageNumbers.length - 1] < totalPages - 1 ? (
                      <span className="brcris-panel-table__page-ellipsis">
                        …
                      </span>
                    ) : null}
                    {/* Evita salto caro (ex.: página 1000) em rankings terms no ES */}
                    {totalPages <= 100 ? (
                      <button
                        type="button"
                        className="brcris-panel-table__page-btn"
                        onClick={() => goToPage(totalPages)}
                      >
                        {totalPages}
                      </button>
                    ) : null}
                  </>
                ) : null}

                <button
                  type="button"
                  className="brcris-panel-table__page-btn"
                  disabled={page >= totalPages}
                  aria-label={t("Next page")}
                  onClick={() => goToPage(Math.min(totalPages, page + 1))}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
