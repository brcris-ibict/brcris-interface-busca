import {
  type FacetViewProps,
  MultiCheckboxFacet,
} from "@elastic/react-search-ui-views";

function getOptionYear(value: unknown): number {
  const text =
    typeof value === "object" && value !== null && "name" in value
      ? String((value as { name: string }).name)
      : String(value ?? "");
  const year = Number(text.match(/\d{4}/)?.[0]);
  return Number.isFinite(year) ? year : 0;
}

/** Ordena facet de ano (value) do mais recente para o mais antigo. */
export default function YearFacetNewestFirstView(props: FacetViewProps) {
  const sortedOptions = [...(props.options ?? [])].sort((a, b) => {
    return getOptionYear(b.value) - getOptionYear(a.value);
  });

  return <MultiCheckboxFacet {...props} options={sortedOptions} />;
}
