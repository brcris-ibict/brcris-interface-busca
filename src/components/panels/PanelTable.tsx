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
  title: string;
  caption: string;
  items: T[];
  columns: PanelTableColumn<T>[];
  getRowKey: (row: T) => string;
  loading: boolean;
  error: boolean;
  initialSortKey: string;
  initialSortDirection?: PanelTableSortDirection;
  pageSize?: number;
  feedbackHeight?: number;
  paginationMode?: "client" | "server";
  page?: number;
  totalItems?: number;
  onPageChange?: (page: number) => void;
  clientSort?: boolean;
  exportFilename?: string;
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
  paginationMode = "client",
  page: controlledPage,
  totalItems,
  onPageChange,
  clientSort = true,
  exportFilename,
}: Props<T>) {
  const { t, i18n } = useTranslation("common");
  const locale = i18n.language || "pt-BR";
  const empty = !loading && !error && items.length === 0;
  const isServer = paginationMode === "server";

  const [internalPage, setInternalPage] = useState(1);
  const [sortKey, setSortKey] = useState(initialSortKey);
  const [sortDirection, setSortDirection] =
    useState<PanelTableSortDirection>(initialSortDirection);

  const page = isServer ? (controlledPage ?? 1) : internalPage;

  useEffect(() => {
    if (!isServer) {
      setInternalPage(1);
    }
    setSortKey(initialSortKey);
    setSortDirection(initialSortDirection);
  }, [items, initialSortKey, initialSortDirection, isServer]);

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

  const exportColumns = useMemo(
    () =>
      columns.map((column) => ({
        key: column.key,
        header: column.header,
      })),
    [columns],
  );

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

  const totalPages = Math.max(
    1,
    Math.ceil(
      (isServer ? (totalItems ?? items.length) : sortedItems.length) / pageSize,
    ),
  );

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
              <table className="brcris-panel-table__table">
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
                    <button
                      type="button"
                      className="brcris-panel-table__page-btn"
                      onClick={() => goToPage(totalPages)}
                    >
                      {totalPages}
                    </button>
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
