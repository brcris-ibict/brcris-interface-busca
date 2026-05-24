import { useTranslation } from "next-i18next";
import type { DisplayField } from "../../configs/DisplayFields";
import styles from "../../styles/Home.module.css";
import SearchTableCell from "./SearchTableCell";
import {
  getFieldColumnClassName,
  getPrimaryColumnClassName,
  getResultTitle,
  type SearchResultRecord,
  stringifyValue,
} from "./utils";

type SearchResultsTableProps = {
  entityKey: string;
  results: SearchResultRecord[];
  selectedTableColumns: DisplayField[];
  primaryColumnLabel: string;
};

export default function SearchResultsTable({
  entityKey,
  results,
  selectedTableColumns,
  primaryColumnLabel,
}: SearchResultsTableProps) {
  const { t } = useTranslation("common");
  const primaryColumnClassName = getPrimaryColumnClassName(entityKey, styles);

  return (
    <div className={styles.tableWrap}>
      <table className={styles.resultsTable}>
        <thead>
          <tr>
            <th className={primaryColumnClassName}>{primaryColumnLabel}</th>
            {selectedTableColumns.map((field) => (
              <th
                key={field.key}
                className={getFieldColumnClassName(
                  entityKey,
                  field.key,
                  styles,
                )}
              >
                {t(field.label)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {results.map((result, idx) => {
            const idValue = stringifyValue(result.id?.raw);
            const href = idValue ? `/${entityKey}/${idValue}` : undefined;

            return (
              <tr key={`${idValue || "result"}-${idx}`}>
                <td className={primaryColumnClassName}>
                  {href ? (
                    <a href={href}>{getResultTitle(result)}</a>
                  ) : (
                    getResultTitle(result)
                  )}
                </td>
                {selectedTableColumns.map((field) => (
                  <td
                    key={`${field.key}-${idx}`}
                    className={getFieldColumnClassName(
                      entityKey,
                      field.key,
                      styles,
                    )}
                  >
                    <SearchTableCell
                      entityKey={entityKey}
                      fieldKey={field.key}
                      result={result}
                    />
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
