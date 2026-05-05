export type SortingOption = {
  value: string;
  label: string;
};

export type SortingViewProps = {
  className?: string;
  onChange: (sortData?: any) => void;
  options: SortingOption[];
  value: string;
};

export type ResultsPerPageViewProps = {
  className?: string;
  onChange: (value: number) => void;
  options: number[];
  value: number;
};

export type ViewMode = "list" | "table";
