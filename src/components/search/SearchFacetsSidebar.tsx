import * as reactSearchUi from "@elastic/react-search-ui";
import { useTranslation } from "next-i18next";
import styles from "../../styles/Home.module.css";
import RangeFacetNewestFirstView from "./RangeFacetNewestFirstView";

const RANGE_FACETS_NEWEST_FIRST = new Set(["publicationDate"]);

type SearchFacetsSidebarProps = {
  facets: string[];
  showFilters: boolean;
  toggled: boolean;
  onOpen: () => void;
  onClose: () => void;
};

export default function SearchFacetsSidebar({
  facets,
  showFilters,
  toggled,
  onOpen,
  onClose,
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
        {facets.map((facet) => (
          <reactSearchUi.Facet
            className={`facet-${facet}`}
            key={facet}
            field={facet}
            label={t(facet.toLowerCase(), { ns: "facets" })}
            view={
              RANGE_FACETS_NEWEST_FIRST.has(facet)
                ? RangeFacetNewestFirstView
                : undefined
            }
          />
        ))}
      </div>
    </>
  );
}
