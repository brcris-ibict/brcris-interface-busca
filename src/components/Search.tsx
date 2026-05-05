/* eslint-disable @typescript-eslint/ban-ts-comment */
/** biome-ignore-all lint/correctness/useHookAtTopLevel: ok */
/** biome-ignore-all lint/suspicious/noArrayIndexKey: explanation */
/** biome-ignore-all lint/correctness/useExhaustiveDependencies: explanation */

import * as reactSearchUi from "@elastic/react-search-ui";
import { Layout } from "@elastic/react-search-ui-views";
import "@elastic/react-search-ui-views/lib/styles/styles.css";
import { useSearch } from "@elastic/react-search-ui";
import { Eye, List, Maximize2, Minimize2, Table2 } from "lucide-react";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Select from "react-select";
import {
  containsResults,
  getNumericLattesId,
  replaceSpacesWithHyphens,
} from "../../utils/Utils";
import {
  getDefaultDisplayFields,
  getDisplayFieldsConfig,
} from "../configs/DisplayFields";
import styles from "../styles/Home.module.css";
import switchStyles from "../styles/Switch.module.css";
import type { Index } from "../types/Propos";
import CustomSearchBox from "./CustomSearchBox";
import CustomViewPagingInfo from "./customResultView/CustomViewPagingInfo";
import { DisplayFieldsProvider } from "./customResultView/DisplayFieldsContext";
import DisplayFieldsModal from "./DisplayFieldsModal";
import DownloadModal from "./DownloadModal";
import Loader from "./Loader";

export type SearchProps = {
  index: Index;
};

type SortingOption = {
  value: string;
  label: string;
};

type SortingViewProps = {
  className?: string;
  onChange: (sortData?: any) => void;
  options: SortingOption[];
  value: string;
};

type ResultsPerPageViewProps = {
  className?: string;
  onChange: (value: number) => void;
  options: number[];
  value: number;
};

type ViewMode = "list" | "table";

type SearchFieldValue = {
  raw?: unknown;
  snippet?: string;
};

type SearchResultRecord = Record<string, SearchFieldValue | undefined>;

const sortingSelectStyles = {
  option: () => ({}),
  control: () => ({}),
  dropdownIndicator: () => ({}),
  indicatorSeparator: () => ({}),
  menuPortal: (base: Record<string, unknown>) => ({
    ...base,
    zIndex: 9999,
  }),
  menu: (base: Record<string, unknown>) => ({
    ...base,
    zIndex: 9999,
  }),
};

const stripHtmlTags = (value: string) => value.replace(/<[^>]+>/g, "").trim();

const stringifyValue = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => stringifyValue(item))
      .filter(Boolean)
      .join(", ");
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const preferredKeys = ["name", "title", "label", "acronym"];

    for (const key of preferredKeys) {
      const preferredText = stringifyValue(record[key]);
      if (preferredText) return preferredText;
    }

    const nestedRaw = (record as { raw?: unknown }).raw;
    if (nestedRaw !== undefined) return stringifyValue(nestedRaw);

    const idValue = record.id;
    if (typeof idValue === "string" || typeof idValue === "number") {
      return String(idValue);
    }
  }
  return "";
};

const getFieldTextValue = (result: SearchResultRecord, key: string) => {
  const fieldValue = result[key];
  if (!fieldValue) return "-";

  if (typeof fieldValue.snippet === "string" && fieldValue.snippet.trim()) {
    const snippetText = stripHtmlTags(fieldValue.snippet);
    if (snippetText) return snippetText;
  }

  const rawText = stringifyValue(fieldValue.raw);
  return rawText || "-";
};

const getResultTitle = (result: SearchResultRecord) => {
  const preferredKeys = ["title", "name", "acronym", "id"];
  for (const key of preferredKeys) {
    const value = getFieldTextValue(result, key);
    if (value && value !== "-") {
      return value;
    }
  }
  return "-";
};

export default function Search({ index }: SearchProps) {
  const { t } = useTranslation(["common", "facets"]);
  const translateSortLabel = (label: string, t: any) => {
    switch (label) {
      case "Relevance":
        return t("Relevance");

      case "Nome ASC":
        return t("Name — alphabetical order from A to Z");

      case "Nome DESC":
        return t("Name — alphabetical order from Z to A");

      case "Ano ASC":
        return t("Year (oldest → newest)");

      case "Ano DESC":
        return t("Year (newest → oldest)");

      case "Title ASC":
        return t("Title — alphabetical order from A to Z");

      case "Title DESC":
        return t("Title — alphabetical order from Z to A");

      default:
        return label;
    }
  };
  useEffect(() => {
    console.log("MOUNTED");
    const interval = setInterval(() => {
      const buttons = document.querySelectorAll(".sui-facet-view-more");

      buttons.forEach((btn) => {
        if (btn.textContent === "+ More") {
          btn.textContent = t("see more");
        }
        if (btn.textContent === "- Less") {
          btn.textContent = t("see less");
        }
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);
  const router = useRouter();
  const DownloadModalTyped = DownloadModal as unknown as React.ComponentType<{
    availableFormats?: string[];
  }>;
  const entityKey = router.pathname.split("/")[1];
  const displayFieldsConfig = getDisplayFieldsConfig(entityKey);
  const storageKey = entityKey ? `displayFields:${entityKey}` : "";
  const viewModeStorageKey = entityKey ? `viewMode:${entityKey}` : "";
  const fixedDisplayFields = useMemo(
    () =>
      (displayFieldsConfig || [])
        .filter((field) => field.fixed)
        .map((field) => field.key),
    [displayFieldsConfig],
  );

  const mergeWithFixedFields = useCallback(
    (fields: string[]) =>
      Array.from(new Set([...fixedDisplayFields, ...fields])),
    [fixedDisplayFields],
  );

  const SortingSelectView = ({
    className,
    onChange,
    options,
    value,
  }: SortingViewProps) => {
    const defaultOption = options[0];
    const placeholderOption = { value: "__default__", label: t("Sort by") };
    const nextOptions = [
      placeholderOption,
      ...options.map((opt) => {
        console.log("SORT OPTION:", opt);

        return {
          ...opt,
          label: translateSortLabel(opt.label, t),
        };
      }),
    ];
    const selected =
      nextOptions.find((opt) => opt.value === value) ||
      nextOptions.find((opt) => opt.value === "[]");

    return (
      <div className={`sui-sorting ${className ?? ""}`.trim()}>
        <Select
          className="sui-select"
          classNamePrefix="sui-select"
          value={selected}
          onChange={(option) => {
            if (!option) return;
            if (option.value === "__default__") {
              onChange(defaultOption?.value);
              return;
            }
            onChange(option.value);
          }}
          options={nextOptions}
          isSearchable={false}
          styles={sortingSelectStyles}
          placeholder={t("Sort by")}
          menuPortalTarget={
            typeof window !== "undefined" ? document.body : undefined
          }
        />
      </div>
    );
  };

  const ResultsPerPageSelectView = ({
    className,
    onChange,
    options,
    value,
  }: ResultsPerPageViewProps) => {
    return (
      <div
        className={`${styles.resultsPerPageControl} ${className ?? ""}`.trim()}
      >
        <span className={styles.resultsPerPageLabel}>{t("Show")}</span>
        <select
          className={styles.resultsPerPageSelect}
          value={String(value)}
          onChange={(event) => onChange(Number(event.target.value))}
          aria-label={t("Show")}
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    );
  };

  const handleSelectIndex = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const params = new URLSearchParams(window.location.search);
      router.push(
        `/${replaceSpacesWithHyphens(event.target.value.toLowerCase())}?${params.toString()}`,
      );
    },
    [],
  );

  const [isFluid, setIsFluid] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [showIndicators, setShowIndicators] = useState(true);
  const [showDisplayModal, setShowDisplayModal] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [displayFields, setDisplayFields] = useState<string[]>(
    mergeWithFixedFields(getDefaultDisplayFields(entityKey)),
  );
  const [toggled, setToggled] = useState(false);

  const selectedTableColumns = useMemo(() => {
    if (!displayFieldsConfig) return [];
    const visibleFields =
      displayFields.length === 0
        ? displayFieldsConfig
        : displayFieldsConfig.filter((field) =>
            displayFields.includes(field.key),
          );

    return visibleFields.filter(
      (field) => field.key !== "title" && field.key !== "name",
    );
  }, [displayFields, displayFieldsConfig]);

  const primaryColumnLabel =
    entityKey === "people" ||
    entityKey === "organizations" ||
    entityKey === "research-groups" ||
    entityKey === "courses"
      ? t("Name")
      : t("Title");

  useEffect(() => {
    if (!displayFieldsConfig || !storageKey) return;
    const saved = window.localStorage.getItem(storageKey);
    if (!saved) {
      setDisplayFields(
        mergeWithFixedFields(getDefaultDisplayFields(entityKey)),
      );
      return;
    }
    try {
      const parsed = JSON.parse(saved) as string[];
      setDisplayFields(mergeWithFixedFields(parsed));
    } catch {
      setDisplayFields(
        mergeWithFixedFields(getDefaultDisplayFields(entityKey)),
      );
    }
  }, [entityKey, displayFieldsConfig, storageKey, mergeWithFixedFields]);

  useEffect(() => {
    if (!displayFieldsConfig || !storageKey) return;
    window.localStorage.setItem(storageKey, JSON.stringify(displayFields));
  }, [displayFields, displayFieldsConfig, storageKey]);

  useEffect(() => {
    if (!viewModeStorageKey) return;
    const saved = window.localStorage.getItem(viewModeStorageKey);
    if (saved === "table" || saved === "list") {
      setViewMode(saved);
      return;
    }
    setViewMode("list");
  }, [viewModeStorageKey]);

  useEffect(() => {
    if (!viewModeStorageKey) return;
    window.localStorage.setItem(viewModeStorageKey, viewMode);
  }, [viewMode, viewModeStorageKey]);

  const titleFieldName =
    entityKey === "people" ||
    entityKey === "organizations" ||
    entityKey === "research-groups" ||
    entityKey === "courses"
      ? "name"
      : "title";

  const IndicatorsComponent = useRef(index.indicators).current;
  const {
    wasSearched,
    results,
    isLoading,
    setSearchTerm,
    resultSearchTerm,
    setSort,
    sort,
    error,
  } = useSearch();

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
                background: "#fff",
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
                        <div className={styles.toolbarWrap}>
                          <div
                            className={`${switchStyles["br-switch"]} ${styles.filtersToggleLeft}`}
                            role="presentation"
                          >
                            <input
                              id="switch-filters"
                              type="checkbox"
                              name="switch-filters"
                              checked={showFilters}
                              role="switch"
                              aria-checked={showFilters}
                              onChange={(event) =>
                                setShowFilters(event.target.checked)
                              }
                            />
                            <label htmlFor="switch-filters">
                              {t("Filters")}
                            </label>
                          </div>
                          <div className={styles.toolbar}>
                            {
                              <>
                                {displayFieldsConfig && (
                                  <button
                                    type="button"
                                    className={styles.displayButton}
                                    onClick={() => setShowDisplayModal(true)}
                                  >
                                    <Eye size={16} />
                                    {t("Customize view")}
                                  </button>
                                )}
                                {/** biome-ignore lint/a11y/useSemanticElements: <explanation> */}
                                <div
                                  className={styles.viewModeToggle}
                                  role="group"
                                  aria-label={t("Select result view")}
                                >
                                  <button
                                    type="button"
                                    className={`${styles.viewModeButton} ${
                                      viewMode === "list"
                                        ? styles.viewModeActive
                                        : ""
                                    }`}
                                    onClick={() => setViewMode("list")}
                                    aria-label={t("List view")}
                                    title={t("List view")}
                                  >
                                    <List size={16} />
                                  </button>
                                  <button
                                    type="button"
                                    className={`${styles.viewModeButton} ${
                                      viewMode === "table"
                                        ? styles.viewModeActive
                                        : ""
                                    }`}
                                    onClick={() => setViewMode("table")}
                                    aria-label={t("Table view")}
                                    title={t("Table view")}
                                  >
                                    <Table2 size={16} />
                                  </button>
                                </div>
                                <div
                                  className={`${styles.toolbarControl} ${styles.toolbarControlShow}`}
                                >
                                  <reactSearchUi.ResultsPerPage
                                    options={[10, 20, 50]}
                                    view={ResultsPerPageSelectView}
                                  />
                                </div>
                                <div className={styles.toolbarControl}>
                                  <DownloadModalTyped
                                    availableFormats={["csv", "ris"]}
                                  />
                                </div>{" "}
                                <div className={styles.toolbarControl}>
                                  <reactSearchUi.Sorting
                                    label=""
                                    sortOptions={index.sortOptions}
                                    view={SortingSelectView}
                                  />
                                </div>
                              </>
                            }
                          </div>
                          <div
                            className={`${switchStyles["br-switch"]} ${styles.indicatorsToggle}`}
                            role="presentation"
                          >
                            <input
                              id="switch-indicators"
                              type="checkbox"
                              name="switch-indicators"
                              checked={showIndicators}
                              role="switch"
                              aria-checked={showIndicators}
                              onChange={(event) =>
                                setShowIndicators(event.target.checked)
                              }
                            />
                            <label htmlFor="switch-indicators">
                              {t("Panel")}
                            </label>
                          </div>
                        </div>
                      )}
                    </reactSearchUi.ErrorBoundary>
                  }
                  bodyContent={
                    <>
                      {error && (
                        <p className={`sui-search-error ${className}`}>
                          {t(error.trim())}
                        </p>
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
                        <div
                          className={`${styles.resultsLayout} ${
                            showFilters ? "" : styles.filtersCollapsed
                          } ${showIndicators ? "" : styles.indicatorsHidden}`}
                        >
                          <button
                            type="button"
                            hidden
                            className="sui-layout-sidebar-toggle"
                            onClick={() => setToggled(true)}
                          >
                            {t("Filters")}
                          </button>
                          <div
                            className={`sui-layout-sidebar ${showFilters ? "" : styles.filtersHidden} ${toggled ? "toggled" : ""}`}
                          >
                            <button
                              hidden
                              type="button"
                              className="sui-layout-sidebar-toggle"
                              onClick={() => setToggled(false)}
                            >
                              {t("Close filters")}
                            </button>

                            {Object.keys(index.config.searchQuery.facets!).map(
                              (facet, i) => (
                                <reactSearchUi.Facet
                                  className={`facet-${facet}`}
                                  key={i}
                                  field={facet}
                                  label={t(facet.toLowerCase(), {
                                    ns: "facets",
                                  })}
                                />
                              ),
                            )}
                          </div>
                          <div className="result">
                            <div className={styles.resultsInfo}>
                              <reactSearchUi.PagingInfo
                                view={CustomViewPagingInfo}
                              />
                            </div>
                            {viewMode === "list" ? (
                              <reactSearchUi.Results
                                resultView={index.customView}
                              />
                            ) : (
                              <div className={styles.tableWrap}>
                                <table className={styles.resultsTable}>
                                  <thead>
                                    <tr>
                                      <th
                                        className={
                                          entityKey === "people"
                                            ? styles.peopleNameColumn
                                            : entityKey === "organizations"
                                              ? styles.organizationsNameColumn
                                              : entityKey === "research-groups"
                                                ? styles.researchGroupsNameColumn
                                                : entityKey === "journals"
                                                  ? styles.journalsTitleColumn
                                                  : undefined
                                        }
                                      >
                                        {primaryColumnLabel}
                                      </th>
                                      {selectedTableColumns.map((field) => (
                                        <th
                                          key={field.key}
                                          className={
                                            entityKey === "people" &&
                                            field.key === "memberOf"
                                              ? styles.peopleGroupsColumn
                                              : entityKey ===
                                                    "research-groups" &&
                                                  field.key ===
                                                    "leaderResearcher"
                                                ? styles.researchGroupsLeaderColumn
                                                : entityKey ===
                                                      "research-groups" &&
                                                    field.key === "researchLine"
                                                  ? styles.researchGroupsLineColumn
                                                  : undefined
                                          }
                                        >
                                          {t(field.label)}
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {results?.map((rawResult, idx) => {
                                      const result =
                                        rawResult as SearchResultRecord;
                                      const idValue = stringifyValue(
                                        result.id?.raw,
                                      );
                                      const href = idValue
                                        ? `/${entityKey}/${idValue}`
                                        : undefined;
                                      return (
                                        <tr
                                          key={`${idValue || "result"}-${idx}`}
                                        >
                                          <td
                                            className={
                                              entityKey === "people"
                                                ? styles.peopleNameColumn
                                                : entityKey === "organizations"
                                                  ? styles.organizationsNameColumn
                                                  : entityKey ===
                                                      "research-groups"
                                                    ? styles.researchGroupsNameColumn
                                                    : entityKey === "journals"
                                                      ? styles.journalsTitleColumn
                                                      : undefined
                                            }
                                          >
                                            {href ? (
                                              <a href={href}>
                                                {getResultTitle(result)}
                                              </a>
                                            ) : (
                                              getResultTitle(result)
                                            )}
                                          </td>
                                          {selectedTableColumns.map((field) => (
                                            <td
                                              key={`${field.key}-${idx}`}
                                              className={
                                                entityKey === "people" &&
                                                field.key === "memberOf"
                                                  ? styles.peopleGroupsColumn
                                                  : entityKey ===
                                                        "research-groups" &&
                                                      field.key ===
                                                        "leaderResearcher"
                                                    ? styles.researchGroupsLeaderColumn
                                                    : entityKey ===
                                                          "research-groups" &&
                                                        field.key ===
                                                          "researchLine"
                                                      ? styles.researchGroupsLineColumn
                                                      : undefined
                                              }
                                            >
                                              {(() => {
                                                const fieldTextValue =
                                                  getFieldTextValue(
                                                    result,
                                                    field.key,
                                                  );
                                                const sanitizedLattesId =
                                                  entityKey === "people" &&
                                                  field.key === "lattesId"
                                                    ? getNumericLattesId(
                                                        fieldTextValue,
                                                      )
                                                    : "";

                                                return entityKey === "people" &&
                                                  field.key === "orcid" &&
                                                  fieldTextValue !== "-" ? (
                                                  <a
                                                    href={`https://orcid.org/${fieldTextValue}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                  >
                                                    {fieldTextValue}
                                                  </a>
                                                ) : entityKey === "people" &&
                                                  field.key === "lattesId" &&
                                                  sanitizedLattesId ? (
                                                  <a
                                                    href={`http://lattes.cnpq.br/${sanitizedLattesId}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                  >
                                                    {sanitizedLattesId}
                                                  </a>
                                                ) : entityKey === "people" &&
                                                  field.key === "lattesId" ? (
                                                  "-"
                                                ) : (
                                                  fieldTextValue
                                                );
                                              })()}
                                            </td>
                                          ))}
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            )}
                            <reactSearchUi.Paging />
                          </div>
                          {showIndicators && <IndicatorsComponent />}
                        </div>
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
