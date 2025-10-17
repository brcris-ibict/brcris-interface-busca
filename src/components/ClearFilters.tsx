/* eslint-disable @typescript-eslint/no-unused-vars */
import { withSearch } from "@elastic/react-search-ui";
import type { SearchContextState } from "@elastic/search-ui";
import { useTranslation } from "next-i18next";

function ClearFilters({
  filters,
  resultSearchTerm,
  setSearchTerm,
  clearFilters,
}: SearchContextState) {
  const { t } = useTranslation("common");
  return resultSearchTerm || (filters && filters.length > 0) ? (
    <div>
      <button
        className="btn btn-link"
        type="button"
        onClick={() => {
          clearFilters();
          setSearchTerm("");
        }}
      >
        {t("Clear filters")}
      </button>
    </div>
  ) : null;
}

export default withSearch(
  ({ filters, searchTerm, resultSearchTerm, setSearchTerm, clearFilters }) => ({
    filters,
    searchTerm,
    resultSearchTerm,
    setSearchTerm,
    clearFilters,
  }),
)(ClearFilters);
