import * as reactSearchUi from "@elastic/react-search-ui";
import type { FacetViewProps } from "@elastic/react-search-ui-views";
import { useTranslation } from "next-i18next";
import styles from "../../styles/Home.module.css";
import CaseInsensitiveFacetView from "./CaseInsensitiveFacetView";
import ExcludeLibrariesToggle from "./ExcludeLibrariesToggle";
import RangeFacetNewestFirstView from "./RangeFacetNewestFirstView";
import YearFacetNewestFirstView from "./YearFacetNewestFirstView";

function ResearchLineFacetView(props: FacetViewProps) {
  return <CaseInsensitiveFacetView {...props} field="researchLine" />;
}

const FACET_VIEWS: Record<string, typeof RangeFacetNewestFirstView> = {
  publicationDate: RangeFacetNewestFirstView,
  creationYear: YearFacetNewestFirstView,
  researchLine: ResearchLineFacetView,
};

type SearchFacetsSidebarProps = {
  facets: string[];
  showFilters: boolean;
  toggled: boolean;
  onOpen: () => void;
  onClose: () => void;
  showExcludeLibraries?: boolean;
};

export default function SearchFacetsSidebar({
  facets,
  showFilters,
  toggled,
  onOpen,
  onClose,
  showExcludeLibraries = false,
}: SearchFacetsSidebarProps) {
  const { t } = useTranslation(["common", "facets"]);

  return (
    <>
      <button
        type="button"
        hidden
        className="sui-layout-sidebar-toggle"
        onClick={onOpen}
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
          onClick={onClose}
        >
          {t("Close filters")}
        </button>
        {showExcludeLibraries && (
          <div className={`sui-facet ${styles.orgTypeFacet}`}>
            <legend className="sui-facet__title">{t("Libraries")}</legend>
            <ExcludeLibrariesToggle />
          </div>
        )}
        {facets.map((facet) => (
          <reactSearchUi.Facet
            className={`facet-${facet}`}
            key={facet}
            field={facet}
            label={t(facet.toLowerCase(), { ns: "facets" })}
            view={FACET_VIEWS[facet]}
          />
        ))}
      </div>
    </>
  );
}
