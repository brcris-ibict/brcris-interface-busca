import { useSearch } from "@elastic/react-search-ui";
import {
  type FacetViewProps,
  MultiCheckboxFacet,
} from "@elastic/react-search-ui-views";
import { useMemo } from "react";
import { normalizeText } from "../../../utils/Utils";

type CaseInsensitiveFacetViewProps = FacetViewProps & {
  field: string;
};

type MergedOption = {
  key: string;
  label: string;
  count: number;
  rawValues: string[];
};

function asFilterText(value: unknown): string {
  if (typeof value === "object" && value !== null && "name" in value) {
    return String((value as { name: string }).name);
  }
  return String(value ?? "");
}

export default function CaseInsensitiveFacetView({
  field,
  ...props
}: CaseInsensitiveFacetViewProps) {
  const { filters, setFilter, removeFilter } = useSearch();

  const activeValues = useMemo(() => {
    const filter = filters?.find((item) => item.field === field);
    return new Set((filter?.values ?? []).map(asFilterText));
  }, [filters, field]);

  const mergedOptions = useMemo(() => {
    const groups = new Map<string, MergedOption>();

    for (const option of props.options ?? []) {
      const raw = asFilterText(option.value);
      if (!raw) continue;

      const key = raw.toLocaleLowerCase("pt-BR");
      const existing = groups.get(key);

      if (existing) {
        if (!existing.rawValues.includes(raw)) {
          existing.rawValues.push(raw);
        }
        existing.count += option.count ?? 0;
        if (raw.length > existing.label.length) {
          existing.label = normalizeText(raw);
        }
      } else {
        groups.set(key, {
          key,
          label: normalizeText(raw),
          count: option.count ?? 0,
          rawValues: [raw],
        });
      }
    }

    return [...groups.values()].sort((a, b) =>
      a.label.localeCompare(b.label, "pt-BR", { sensitivity: "base" }),
    );
  }, [props.options]);

  const options = mergedOptions.map((group) => ({
    value: group.label,
    count: group.count,
    selected: group.rawValues.some((value) => activeValues.has(value)),
  }));

  const findGroup = (value: unknown) => {
    const text = asFilterText(value);
    const key = text.toLocaleLowerCase("pt-BR");
    return (
      mergedOptions.find((item) => item.label === text) ||
      mergedOptions.find((item) => item.key === key)
    );
  };

  return (
    <MultiCheckboxFacet
      {...props}
      options={options}
      onSelect={(value) => {
        const group = findGroup(value);
        if (!group) return;

        const next = new Set(activeValues);
        for (const raw of group.rawValues) {
          next.add(raw);
        }
        setFilter(field, [...next], "any");
      }}
      onRemove={(value) => {
        const group = findGroup(value);
        if (!group) return;

        const removeSet = new Set(group.rawValues);
        const next = [...activeValues].filter((item) => !removeSet.has(item));

        if (next.length === 0) {
          removeFilter(field);
          return;
        }

        setFilter(field, next, "any");
      }}
    />
  );
}
