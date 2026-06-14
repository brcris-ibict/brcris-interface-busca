import { useSearch } from "@elastic/react-search-ui";
import {
  type FacetViewProps,
  MultiCheckboxFacet,
} from "@elastic/react-search-ui-views";

const getRangeSortYear = (value: unknown) => {
  const name =
    typeof value === "object" && value !== null && "name" in value
      ? String((value as { name: string }).name)
      : String(value ?? "");
  const years = name.match(/\d{4}/g);
  if (!years?.length) return 0;
  return Number(years[years.length - 1]);
};

const getPublicationDateSortDirection = (state: {
  sortField?: string;
  sortDirection?: string;
  sortList?: Array<{ field: string; direction: string }>;
}) => {
  const fromList = state.sortList?.find(
    (item) => item.field === "publicationDate" && item.direction,
  );
  if (fromList?.direction === "asc" || fromList?.direction === "desc") {
    return fromList.direction;
  }

  if (
    state.sortField === "publicationDate" &&
    (state.sortDirection === "asc" || state.sortDirection === "desc")
  ) {
    return state.sortDirection;
  }

  return null;
};

export default function RangeFacetNewestFirstView(props: FacetViewProps) {
  const { sortField, sortDirection, sortList } = useSearch();
  const yearSortDirection = getPublicationDateSortDirection({
    sortField,
    sortDirection,
    sortList,
  });

  const sortedOptions = [...(props.options ?? [])].sort((a, b) => {
    const yearA = getRangeSortYear(a.value);
    const yearB = getRangeSortYear(b.value);

    if (yearSortDirection === "asc") {
      return yearA - yearB;
    }

    return yearB - yearA;
  });

  return <MultiCheckboxFacet {...props} options={sortedOptions} />;
}
