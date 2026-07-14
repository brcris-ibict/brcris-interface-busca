import * as reactSearchUi from "@elastic/react-search-ui";
import type { ResultViewProps } from "@elastic/react-search-ui-views";
import type { ComponentType } from "react";
import type { DisplayField } from "../../configs/DisplayFields";
import styles from "../../styles/Home.module.css";
import CustomViewPagingInfo from "../customResultView/CustomViewPagingInfo";
import SearchFacetsSidebar from "./SearchFacetsSidebar";
import SearchResultsTable from "./SearchResultsTable";
import type { ViewMode } from "./types";
import type { SearchResultRecord } from "./utils";

type SearchResultsBodyProps = {
  entityKey: string;
  facets: string[];
  showFilters: boolean;
  showIndicators: boolean;
  viewMode: ViewMode;
  toggled: boolean;
  onToggledOpen: () => void;
  onToggledClose: () => void;
  results: SearchResultRecord[];
  selectedTableColumns: DisplayField[];
  primaryColumnLabel: string;
  customView: ComponentType<ResultViewProps>;
  IndicatorsComponent: ComponentType<unknown>;
  showExcludeLibraries?: boolean;
};

export default function SearchResultsBody({
  entityKey,
  facets,
  showFilters,
  showIndicators,
  viewMode,
  toggled,
  onToggledOpen,
  onToggledClose,
  results,
  selectedTableColumns,
  primaryColumnLabel,
  customView,
  IndicatorsComponent,
  showExcludeLibraries = false,
}: SearchResultsBodyProps) {
  return (
    <div
      className={`${styles.resultsLayout} ${
        showFilters ? "" : styles.filtersCollapsed
      } ${showIndicators ? "" : styles.indicatorsHidden}`}
    >
      <SearchFacetsSidebar
        facets={facets}
        showFilters={showFilters}
        toggled={toggled}
        onOpen={onToggledOpen}
        onClose={onToggledClose}
        showExcludeLibraries={showExcludeLibraries}
      />
      <div className="result">
        <div className={styles.resultsInfo}>
          <reactSearchUi.PagingInfo view={CustomViewPagingInfo} />
        </div>
        {viewMode === "list" ? (
          <reactSearchUi.Results resultView={customView} />
        ) : (
          <SearchResultsTable
            entityKey={entityKey}
            results={results}
            selectedTableColumns={selectedTableColumns}
            primaryColumnLabel={primaryColumnLabel}
          />
        )}
        <reactSearchUi.Paging />
      </div>
      {showIndicators && (
        <div className={styles.indicatorsPanel}>
          <IndicatorsComponent />
        </div>
      )}
    </div>
  );
}
