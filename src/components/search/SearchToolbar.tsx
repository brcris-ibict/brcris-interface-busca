import * as reactSearchUi from "@elastic/react-search-ui";
import { Eye, List, Table2 } from "lucide-react";
import { useTranslation } from "next-i18next";
import styles from "../../styles/Home.module.css";
import switchStyles from "../../styles/Switch.module.css";
import type { SortOptionsType } from "../../types/Propos";
import DownloadModal from "../DownloadModal";
import type { ViewMode } from "./types";

type SearchToolbarProps = {
  showFilters: boolean;
  onShowFiltersChange: (value: boolean) => void;
  showIndicators: boolean;
  onShowIndicatorsChange: (value: boolean) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  sortOptions: SortOptionsType[];
  renderResultsPerPageView: (props: {
    className?: string;
    onChange: (resultsPerPage: number) => void;
    options?: number[];
    value?: number;
  }) => React.ReactElement;
  renderSortingView: (props: {
    className?: string;
    onChange: (sortData?: any) => void;
    options: { value: string; label: string }[];
    value: string;
  }) => React.ReactElement;
  showCustomizeView?: boolean;
  onCustomizeClick?: () => void;
};

export default function SearchToolbar({
  showFilters,
  onShowFiltersChange,
  showIndicators,
  onShowIndicatorsChange,
  viewMode,
  onViewModeChange,
  sortOptions,
  renderResultsPerPageView,
  renderSortingView,
  showCustomizeView,
  onCustomizeClick,
}: SearchToolbarProps) {
  const { t } = useTranslation("common");
  const DownloadModalTyped = DownloadModal as unknown as React.ComponentType<{
    availableFormats?: string[];
  }>;

  return (
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
          onChange={(event) => onShowFiltersChange(event.target.checked)}
        />
        <label htmlFor="switch-filters">{t("Filters")}</label>
      </div>
      <div className={styles.toolbar}>
        {showCustomizeView && onCustomizeClick && (
          <button
            type="button"
            className={styles.displayButton}
            onClick={onCustomizeClick}
          >
            <Eye size={16} />
            {t("Customize view")}
          </button>
        )}
        <fieldset
          className={styles.viewModeToggle}
          aria-label={t("Select result view")}
        >
          <button
            type="button"
            className={`${styles.viewModeButton} ${
              viewMode === "list" ? styles.viewModeActive : ""
            }`}
            onClick={() => onViewModeChange("list")}
            aria-label={t("List view")}
            title={t("List view")}
          >
            <List size={16} />
          </button>
          <button
            type="button"
            className={`${styles.viewModeButton} ${
              viewMode === "table" ? styles.viewModeActive : ""
            }`}
            onClick={() => onViewModeChange("table")}
            aria-label={t("Table view")}
            title={t("Table view")}
          >
            <Table2 size={16} />
          </button>
        </fieldset>
        <div
          className={`${styles.toolbarControl} ${styles.toolbarControlShow}`}
        >
          <reactSearchUi.ResultsPerPage
            options={[10, 20, 50]}
            view={renderResultsPerPageView}
          />
        </div>
        <div className={styles.toolbarControl}>
          <DownloadModalTyped availableFormats={["csv", "ris"]} />
        </div>
        <div className={styles.toolbarControl}>
          <reactSearchUi.Sorting
            label=""
            sortOptions={sortOptions}
            view={renderSortingView}
          />
        </div>
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
          onChange={(event) => onShowIndicatorsChange(event.target.checked)}
        />
        <label htmlFor="switch-indicators">{t("Panel")}</label>
      </div>
    </div>
  );
}
