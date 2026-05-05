import Select from "react-select";
import type { SortingViewProps } from "./types";

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

type SortingSelectViewComponentProps = SortingViewProps & {
  translateSortLabel: (label: string) => string;
  placeholder: string;
};

export default function SortingSelectView({
  className,
  onChange,
  options,
  value,
  translateSortLabel,
  placeholder,
}: SortingSelectViewComponentProps) {
  const defaultOption = options[0];
  const placeholderOption = { value: "__default__", label: placeholder };
  const nextOptions = [
    placeholderOption,
    ...options.map((opt) => ({
      ...opt,
      label: translateSortLabel(opt.label),
    })),
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
        placeholder={placeholder}
        menuPortalTarget={
          typeof window !== "undefined" ? document.body : undefined
        }
      />
    </div>
  );
}
