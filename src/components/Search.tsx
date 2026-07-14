/* eslint-disable @typescript-eslint/ban-ts-comment */
/** biome-ignore-all lint/a11y/useSemanticElements: <explanation> */
/** biome-ignore-all lint/correctness/useHookAtTopLevel: ok */
/** biome-ignore-all lint/suspicious/noArrayIndexKey: explanation */
/** biome-ignore-all lint/correctness/useExhaustiveDependencies: explanation */

import * as reactSearchUi from "@elastic/react-search-ui";
import { Layout } from "@elastic/react-search-ui-views";
import "@elastic/react-search-ui-views/lib/styles/styles.css";
import { useSearch } from "@elastic/react-search-ui";
import { Maximize2, Minimize2 } from "lucide-react";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { useCallback, useRef, useState } from "react";
import { containsResults, replaceSpacesWithHyphens } from "../../utils/Utils";
import { getDefaultDisplayFields } from "../configs/DisplayFields";
import styles from "../styles/Home.module.css";
import type { Index } from "../types/Propos";
import CustomSearchBox from "./CustomSearchBox";
import { DisplayFieldsProvider } from "./customResultView/DisplayFieldsContext";
import DisplayFieldsModal from "./DisplayFieldsModal";
import Loader from "./Loader";
import { useFacetViewMoreTranslation } from "./search/hooks/useFacetViewMoreTranslation";
import { useSearchDisplayFields } from "./search/hooks/useSearchDisplayFields";
import { useTranslateSortLabel } from "./search/hooks/useTranslateSortLabel";
import { useViewMode } from "./search/hooks/useViewMode";
import ResultsPerPageSelectView from "./search/ResultsPerPageSelectView";
import SearchResultsBody from "./search/SearchResultsBody";
import SearchToolbar from "./search/SearchToolbar";
import SortingSelectView from "./search/SortingSelectView";
import {
  getTitleFieldName,
  isNameBasedEntity,
  type SearchResultRecord,
} from "./search/utils";

export type SearchProps = {
  index: Index;
};

export default function Search({ index }: SearchProps) {
  const { t } = useTranslation(["common", "facets"]);
  const translateSortLabel = useTranslateSortLabel();
  useFacetViewMoreTranslation();
  const router = useRouter();
  const entityKey = router.pathname.split("/")[1];
  const {
    displayFieldsConfig,
    displayFields,
    setDisplayFields,
    mergeWithFixedFields,
    selectedTableColumns,
  } = useSearchDisplayFields(entityKey);
  const { viewMode, setViewMode } = useViewMode(entityKey);

  const handleSelectIndex = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      router.push(
        `/${replaceSpacesWithHyphens(event.target.value.toLowerCase())}`,
      );
    },
    [router],
  );

  const [isFluid, setIsFluid] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [showIndicators, setShowIndicators] = useState(true);
  const [showDisplayModal, setShowDisplayModal] = useState(false);
  const [toggled, setToggled] = useState(false);

  const primaryColumnLabel = isNameBasedEntity(entityKey)
    ? t("Name")
    : t("Title");

  const titleFieldName = getTitleFieldName(entityKey);
  const IndicatorsComponent = useRef(index.indicators).current;
  const facetKeys = Object.keys(index.config.searchQuery.facets!);

  const renderResultsPerPageView = useCallback(
    (props: {
      className?: string;
      onChange: (resultsPerPage: number) => void;
      options?: number[];
      value?: number;
    }) => (
      <ResultsPerPageSelectView
        className={props.className}
        onChange={props.onChange}
        options={props.options ?? [10, 20, 50]}
        value={props.value ?? 10}
        showLabel={t("Show")}
      />
    ),
    [t],
  );

  const renderSortingView = useCallback(
    (props: {
      className?: string;
      onChange: (sortData?: any) => void;
      options: { value: string; label: string }[];
      value: string;
    }) => (
      <SortingSelectView
        {...props}
        translateSortLabel={translateSortLabel}
        placeholder={t("Sort by")}
      />
    ),
    [t, translateSortLabel],
  );

  const {
    wasSearched,
    results,
    isLoading,
    setSearchTerm,
    resultSearchTerm,
    error,
    filters,
  } = useSearch();

  const shouldHideEmptySearchError =
    error?.trim() === "Search term or filters are required" &&
    !resultSearchTerm &&
    (!filters || filters.length === 0);

  const tableResults = (results ?? []) as SearchResultRecord[];

  return (
    <>
      <div className={`${isFluid ? "container-fluid" : "container"}`}>
        <div className="App">
          <div className="container page">
            <div className="page-title">
              <h1>{t(index.label)}</h1>
            </div>
          </div>
          <div>
            <button
              type="button"
              onClick={() => setIsFluid(!isFluid)}
              style={{
                border: "1px solid var(--border-color)",
                background: "transparent",
                float: "right",
              }}
              aria-label="Toggle container width"
            >
              {isFluid ? <Minimize2 /> : <Maximize2 size={20} />}
            </button>
            <div className={styles.searchLayout}>
              {isLoading ? <Loader /> : ""}
              <DisplayFieldsProvider value={{ selectedFields: displayFields }}>
                <Layout
                  header={
                    <CustomSearchBox
                      titleFieldName={titleFieldName}
                      setSearchTerm={setSearchTerm!}
                      handleSelectIndex={handleSelectIndex}
                      indexLabel={index.label}
                      fieldNames={Object.keys(
                        index.config.searchQuery.search_fields as object,
                      ).concat(
                        Object.keys(
                          index.config.searchQuery.advanced_fields ||
                            ([] as object),
                        ),
                      )}
                    />
                  }
                  bodyHeader={
                    <reactSearchUi.ErrorBoundary
                      className={styles.searchErrorHidden}
                    >
                      {containsResults(wasSearched, results) && (
                        <SearchToolbar
                          showFilters={showFilters}
                          onShowFiltersChange={setShowFilters}
                          showIndicators={showIndicators}
                          onShowIndicatorsChange={setShowIndicators}
                          viewMode={viewMode}
                          onViewModeChange={setViewMode}
                          sortOptions={index.sortOptions}
                          renderResultsPerPageView={renderResultsPerPageView}
                          renderSortingView={renderSortingView}
                          showCustomizeView={!!displayFieldsConfig}
                          onCustomizeClick={() => setShowDisplayModal(true)}
                        />
                      )}
                    </reactSearchUi.ErrorBoundary>
                  }
                  bodyContent={
                    <>
                      {error && !shouldHideEmptySearchError && (
                        <p className="sui-search-error">{t(error.trim())}</p>
                      )}
                      {!error &&
                        wasSearched &&
                        results?.length === 0 &&
                        resultSearchTerm && (
                          <strong>
                            {t("No documents were found for your search")}
                          </strong>
                        )}
                      {!error && containsResults(wasSearched, results) && (
                        <SearchResultsBody
                          entityKey={entityKey}
                          facets={facetKeys}
                          showFilters={showFilters}
                          showIndicators={showIndicators}
                          viewMode={viewMode}
                          toggled={toggled}
                          onToggledOpen={() => setToggled(true)}
                          onToggledClose={() => setToggled(false)}
                          results={tableResults}
                          selectedTableColumns={selectedTableColumns}
                          primaryColumnLabel={primaryColumnLabel}
                          customView={index.customView}
                          IndicatorsComponent={IndicatorsComponent}
                          showExcludeLibraries={entityKey === "organizations"}
                        />
                      )}
                    </>
                  }
                />
              </DisplayFieldsProvider>
            </div>
          </div>
        </div>
      </div>
      {displayFieldsConfig && (
        <DisplayFieldsModal
          show={showDisplayModal}
          onHide={() => setShowDisplayModal(false)}
          fields={displayFieldsConfig}
          selected={displayFields}
          onChange={(next) => setDisplayFields(mergeWithFixedFields(next))}
          onReset={() =>
            setDisplayFields(
              mergeWithFixedFields(getDefaultDisplayFields(entityKey)),
            )
          }
        />
      )}
    </>
  );
}
