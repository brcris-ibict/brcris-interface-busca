import type { PeopleDashboardFilters } from "../../types/PeopleDashboard";

type Props = {
  value: PeopleDashboardFilters;
  onChange: (filters: PeopleDashboardFilters) => void;
  disabled?: boolean;
};

export default function PeopleFilters({ disabled = false }: Props) {
  return (
    <div className="brcris-filters" aria-disabled={disabled || undefined}>
      <div className="brcris-filters__fields" />
    </div>
  );
}
