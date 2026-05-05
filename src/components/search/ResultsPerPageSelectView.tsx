import styles from "../../styles/Home.module.css";
import type { ResultsPerPageViewProps } from "./types";

type ResultsPerPageSelectViewComponentProps = ResultsPerPageViewProps & {
  showLabel: string;
};

export default function ResultsPerPageSelectView({
  className,
  onChange,
  options,
  value,
  showLabel,
}: ResultsPerPageSelectViewComponentProps) {
  return (
    <div
      className={`${styles.resultsPerPageControl} ${className ?? ""}`.trim()}
    >
      <span className={styles.resultsPerPageLabel}>{showLabel}</span>
      <select
        className={styles.resultsPerPageSelect}
        value={String(value)}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-label={showLabel}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
