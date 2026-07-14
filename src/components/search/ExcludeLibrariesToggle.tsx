import { useSearch } from "@elastic/react-search-ui";
import { useTranslation } from "next-i18next";
import {
  EXCLUDE_LIBRARIES_FILTER_FIELD,
  ORG_LIBRARY_TYPE,
  shouldExcludeOrgLibraries,
} from "../../lib/orgunitSearchQuery";
import styles from "../../styles/Home.module.css";
import switchStyles from "../../styles/Switch.module.css";

export default function ExcludeLibrariesToggle() {
  const { t } = useTranslation("common");
  const { filters, setFilter, removeFilter } = useSearch();

  const excludeLibraries = shouldExcludeOrgLibraries(filters);

  return (
    <div
      className={`${switchStyles["br-switch"]} ${styles.excludeLibrariesSwitch}`}
      role="presentation"
    >
      <input
        id="switch-exclude-libraries"
        type="checkbox"
        name="switch-exclude-libraries"
        checked={excludeLibraries}
        role="switch"
        aria-checked={excludeLibraries}
        onChange={(event) => {
          if (event.target.checked) {
            setFilter(EXCLUDE_LIBRARIES_FILTER_FIELD, "true", "all");
            removeFilter("type", ORG_LIBRARY_TYPE);
          } else {
            removeFilter(EXCLUDE_LIBRARIES_FILTER_FIELD);
          }
        }}
      />
      <label htmlFor="switch-exclude-libraries">{t("Hide libraries")}</label>
    </div>
  );
}
