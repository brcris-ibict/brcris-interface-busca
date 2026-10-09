import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "next-i18next";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import ChartExportMenu from "./ChartExportMenu";
import ChartFeedback from "./ChartFeedback";
import PanelTableSearch from "./PanelTableSearch";
import { highlightSegments, matchesSearch } from "../../lib/textSearch";

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
  searchable?: boolean; // Se true, exibe a busca por palavra-chave no cabeçalho
  searchMode?: "client" | "server"; // "client" filtra em memória; "server" delega ao pai via onSearch (default = paginationMode)
  searchValue?: string; // Termo aplicado (controlado; obrigatório no modo server)
  onSearch?: (term: string) => void; // Chamado ao pesquisar/limpar (modo server: o pai refaz o fetch e volta à página 1)
  searchPlaceholder?: string; // Placeholder contextual do campo de busca
  searchKeys?: string[]; // Modo client: colunas usadas no filtro (default = colunas de texto)
};

// Destaca o termo buscado dentro do texto da célula
function renderHighlight(text: string, term: string): ReactNode {
  const segments = highlightSegments(text, term);
  if (segments.length === 1 && !segments[0].match) return text;

  return segments.map((segment, index) =>
    segment.match ? (
      <mark key={index} className="brcris-panel-table__highlight">
        {segment.text}
      </mark>
    ) : (
      <span key={index}>{segment.text}</span>
    ),
  );
}

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
  searchable = false,
  searchMode,
  searchValue,
  onSearch,
  searchPlaceholder,
  searchKeys,
}: Props<T>) {
  const { t, i18n } = useTranslation("common"); // Idioma da aplicação
  const locale = i18n.language || "pt-BR"; // Idioma da aplicação
  const isServer = paginationMode === "server"; // Verifica se a paginação é no servidor
  const isServerSearch = (searchMode ?? paginationMode) === "server"; // Busca delegada ao pai (ex.: Elasticsearch)

  const [internalPage, setInternalPage] = useState(1); // Página interna
  const [sortKey, setSortKey] = useState(initialSortKey);
  const [sortDirection, setSortDirection] = useState<PanelTableSortDirection>(initialSortDirection);
  const [internalSearch, setInternalSearch] = useState(""); // Termo aplicado no modo client não controlado
  const activeSearch = searchable ? (searchValue ?? internalSearch).trim() : "";
  const hasActiveSearch = activeSearch.length > 0;

  const page = isServer ? (controlledPage ?? 1) : internalPage; // Página atual

  // Efeito para reiniciar a página interna quando os itens ou os critérios de ordenação mudam
  useEffect(() => {
    if (!isServer) {
      setInternalPage(1); // Reinicia a página interna para 1
    }

    setSortKey(initialSortKey);
    setSortDirection(initialSortDirection);

  }, [items, initialSortKey, initialSortDirection, isServer]);

  // Colunas de texto consideradas na busca/destaque (numéricas ficam de fora)
  const searchColumnKeys = useMemo(
    () =>
      new Set(
        columns
          .filter((column) =>
            searchKeys
              ? searchKeys.includes(column.key)
              : column.align !== "right" && column.sortAs !== "number",
          )
          .map((column) => column.key),
      ),
    [columns, searchKeys],
  );

  // Modo client: filtra em memória antes de ordenar/paginar
  const filteredItems = useMemo(() => {
    if (!hasActiveSearch || isServerSearch) return items;

    return items.filter((row) =>
      matchesSearch(
        columns
          .filter((column) => searchColumnKeys.has(column.key))
          .map((column) => String(column.accessor(row)))
          .join(" "),
        activeSearch,
      ),
    );
  }, [items, columns, searchColumnKeys, activeSearch, hasActiveSearch, isServerSearch]);

  const empty = !loading && !error && filteredItems.length === 0;

  // Efeito para ordenar os itens quando os critérios de ordenação mudam
  const sortedItems = useMemo(() => {
    if (!clientSort) return filteredItems;

    const column = columns.find((item) => item.key === sortKey);
    if (!column) return filteredItems;

    const next = [...filteredItems];
    next.sort((a, b) =>
      compareValues(column.accessor(a), column.accessor(b), sortDirection),
    );

    return next;
  }, [filteredItems, columns, sortKey, sortDirection, clientSort]);

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

  // Aplica/limpa a busca; no modo client volta para a página 1
  function handleSearch(term: string) {
    if (!isServerSearch) {
      if (searchValue === undefined) setInternalSearch(term);
      setInternalPage(1);
    }
    onSearch?.(term);
  }

  // Resumo da busca ativa (chip + anúncio para leitor de tela)
  const searchTotal = isServerSearch
    ? (totalItems ?? items.length)
    : filteredItems.length;
  const searchSummary = hasActiveSearch
    ? t("Search results for", {
        term: activeSearch,
        totalLabel: loading ? "…" : searchTotal.toLocaleString(locale),
      })
    : "";

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
          <h2 className="brcris-chart-card__title">{title}</h2>
          <p className="brcris-panel-table__caption">{caption}</p>
          {hasActiveSearch ? (
            <div className="brcris-panel-table__search-chip">
              <span>{searchSummary}</span>
              <button
                type="button"
                aria-label={t("Clear search")}
                title={t("Clear search")}
                onClick={() => handleSearch("")}
              >
                <X size={12} aria-hidden />
              </button>
            </div>
          ) : null}
          <span className="visually-hidden" aria-live="polite">
            {hasActiveSearch && !loading ? searchSummary : ""}
          </span>
        </div>

        {exportFilename || searchable ? (
          <div className="brcris-chart-card__toggles" role="group">
            {searchable ? (
              <PanelTableSearch
                value={activeSearch}
                onSearch={handleSearch}
                placeholder={searchPlaceholder}
              />
            ) : null}
            {exportFilename ? (
              <ChartExportMenu
                filename={exportFilename}
                columns={exportColumns}
                rows={exportRows}
                onExportCsv={fetchExportRows}
                disabled={loading || error || filteredItems.length === 0}
              />
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="brcris-panel-table__body" aria-busy={loading}>
        <ChartFeedback
          height={feedbackHeight}
          loading={loading}
          error={error}
          empty={empty}
          emptyMessage={
            hasActiveSearch
              ? t("No results for term", { term: activeSearch })
              : undefined
          }
          emptyAction={
            hasActiveSearch ? (
              <button
                type="button"
                className="brcris-chart-card__feedback-action"
                onClick={() => handleSearch("")}
              >
                {t("Clear search")}
              </button>
            ) : undefined
          }
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
                          : hasActiveSearch && searchColumnKeys.has(column.key)
                            ? renderHighlight(String(value), activeSearch)
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
