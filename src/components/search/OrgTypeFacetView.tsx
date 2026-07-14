import { useSearch } from "@elastic/react-search-ui";
import {
  type FacetViewProps,
  MultiCheckboxFacet,
} from "@elastic/react-search-ui-views";
import {
  ORG_LIBRARY_TYPE,
  shouldExcludeOrgLibraries,
} from "../../lib/orgunitSearchQuery";
import styles from "../../styles/Home.module.css";
import ExcludeLibrariesToggle from "./ExcludeLibrariesToggle";

export default function OrgTypeFacetView(props: FacetViewProps) {
  const { filters } = useSearch();
  const excludeLibraries = shouldExcludeOrgLibraries(filters);

  const options = excludeLibraries
    ? (props.options ?? []).filter((option) => {
        const value =
          typeof option.value === "object" &&
          option.value !== null &&
          "name" in option.value
            ? String((option.value as { name: string }).name)
            : String(option.value ?? "");
        return value !== ORG_LIBRARY_TYPE;
      })
    : props.options;

  return (
    <fieldset className={`sui-facet ${styles.orgTypeFacet}`}>
      <legend className="sui-facet__title">{props.label}</legend>
      <ExcludeLibrariesToggle />
      <div className={styles.orgTypeFacetOptions}>
        <MultiCheckboxFacet {...props} label="" options={options} />
      </div>
    </fieldset>
  );
}
