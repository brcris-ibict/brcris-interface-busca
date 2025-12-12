import { useTranslation } from "next-i18next";

type Props = {
  options: number[];
  value: number;
  onChange: (value: number) => void;
};

export default function CustomResultsPerPage({
  options,
  value,
  onChange,
}: Props) {
  const { t } = useTranslation("common");

  return (
    <div className="sui-results-per-page">
      <label
        className="sui-results-per-page__label"
        htmlFor="results-per-page-select"
      >
        {t("Show")}
      </label>

      <select
        id="results-per-page-select"
        className="sui-results-per-page__select"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}
