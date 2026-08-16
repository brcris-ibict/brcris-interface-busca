import { withSearch } from "@elastic/react-search-ui";
import type { SearchContextState } from "@elastic/search-ui";
import { CircleX, Plus, Search } from "lucide-react";
import { useTranslation } from "next-i18next";
import { type FormEvent, useState } from "react";
import styles from "../styles/AdvancedSearch.module.css";
import type { QueryItem } from "../types/Entities";
import { findPropertyByValue } from "./SearchSanitization";

interface CustomSearchBoxProps extends SearchContextState {
  fieldNames: string[];
}

function fieldSupportsFuzzy(fieldLabel: string): boolean {
  if (!fieldLabel || fieldLabel === "Select") return false;
  const key = findPropertyByValue(fieldLabel);
  return (
    key.endsWith("_text") || key === "keyword" || key === "keywords"
  );
}

function formatQueryValue(row: QueryItem): string {
  const value = row.value.trim();
  if (!row.isFuzzy) return value;
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    value.endsWith("~")
  ) {
    return value;
  }
  return `${value}~`;
}

const AdvancedSearchBox = ({
  setSearchTerm,
  fieldNames,
}: CustomSearchBoxProps) => {
  const { t } = useTranslation(["advanced", "common"]);
  const [inputs, setInputs] = useState<QueryItem[]>([
    { field: "Select", value: "", isFuzzy: false },
  ]);

  const translatedFieldNames = fieldNames.map((field) => t(field));

  const addInput = () => {
    setInputs([
      ...inputs,
      { value: "", field: t("Select"), operator: "AND", isFuzzy: false },
    ]);
  };

  const removeInput = (index: number) => {
    const newInputs = [...inputs];
    newInputs.splice(index, 1);
    setInputs(newInputs);
  };

  const handleChange = (
    index: number,
    { value, operator, field, isFuzzy }: QueryItem,
  ) => {
    const newInputs = [...inputs];
    if (value !== undefined) {
      newInputs[index].value = value;
    } else if (operator) {
      newInputs[index].operator = operator;
    } else if (field) {
      newInputs[index].field = field;
      newInputs[index].isFuzzy = false;
    } else if (isFuzzy !== undefined) {
      newInputs[index].isFuzzy = isFuzzy;
    }
    setInputs(newInputs);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (inputs.length === 0 || !isFormValid) return;

    let formatted = `(${inputs[0].field}:${formatQueryValue(inputs[0])})`;

    for (let i = 1; i < inputs.length; i++) {
      const row = inputs[i];
      formatted += ` ${row.operator} (${row.field}:${formatQueryValue(row)})`;
    }

    setSearchTerm(formatted);
  };

  const isFormValid = inputs.some(
    (input) =>
      input.field !== "" &&
      input.field !== "Select" &&
      input.value?.trim() !== "" &&
      input.value.trim().length >= 3,
  );

  return (
    <div className="d-flex flex-column advanced">
      <form className={styles.advancedSearch} onSubmit={handleSubmit}>
        {inputs.map((campo, index) => {
          const valueId = `search-value-${index}`;
          const fieldId = `search-field-${index}`;
          const operatorId = `search-operator-${index}`;
          const matchModeId = `search-match-mode-${index}`;
          const showFuzzy = fieldSupportsFuzzy(campo.field);

          return (
            <div
              className={`d-flex align-content-center ${styles.container}`}
              key={index}
            >
              <div className={`d-flex flex-gap-0 ${styles.group}`}>
                {index > 0 && (
                  <>
                    <label htmlFor={operatorId} className="visually-hidden">
                      {t("Operator")}
                    </label>
                    <select
                      id={operatorId}
                      value={campo.operator}
                      onChange={(e) =>
                        handleChange(index, {
                          operator: e.target.value,
                        } as QueryItem)
                      }
                      className={`form-select ${styles.op}`}
                    >
                      <option value="AND">AND</option>
                      <option value="OR">OR</option>
                      <option value="AND NOT">AND NOT</option>
                    </select>
                  </>
                )}

                <label htmlFor={valueId} className="visually-hidden">
                  {t("Search value")}
                </label>
                <input
                  id={valueId}
                  value={campo.value}
                  onChange={(e) =>
                    handleChange(index, { value: e.target.value } as QueryItem)
                  }
                  type="text"
                  className={`sui-search-box__text-input ${
                    index === 0 ? styles.firstInput : ""
                  }`}
                />

                {showFuzzy && (
                  <>
                    <label htmlFor={matchModeId} className="visually-hidden">
                      {t("Match mode")}
                    </label>
                    <select
                      id={matchModeId}
                      value={campo.isFuzzy ? "true" : "false"}
                      onChange={(e) =>
                        handleChange(index, {
                          isFuzzy: e.target.value === "true",
                        } as QueryItem)
                      }
                      className={`form-select ${styles.matchMode}`}
                    >
                      <option value="false">{t("Exact")}</option>
                      <option value="true">{t("Approximate")}</option>
                    </select>
                  </>
                )}

                <label htmlFor={fieldId} className="visually-hidden">
                  {t("Field")}
                </label>
                <select
                  id={fieldId}
                  value={campo.field}
                  onChange={(e) =>
                    handleChange(index, { field: e.target.value } as QueryItem)
                  }
                  className="form-select"
                >
                  <option value="Select">{t("Select")}</option>
                  {translatedFieldNames.map((field) => (
                    <option key={field} value={field}>
                      {field.toLowerCase() === "doi" ? "DOI" : field}
                    </option>
                  ))}
                </select>
              </div>

              {index > 0 && (
                <span
                  onClick={() => removeInput(index)}
                  className="d-flex align-items-center"
                >
                  <CircleX aria-hidden="true" />
                </span>
              )}
            </div>
          );
        })}

        <div className="d-flex flex-justify-content-between">
          <button
            type="button"
            className="btn-link d-flex align-items-center flex-gap-8"
            onClick={addInput}
          >
            <Plus aria-hidden="true" />
            Adicionar campo
          </button>

          <button
            disabled={!isFormValid}
            className="btn btn-primary search-button"
            type="submit"
          >
            <Search aria-hidden="true" /> {t("Search")}
          </button>
        </div>
      </form>
    </div>
  );
};

export default withSearch(({ setSearchTerm }) => ({
  setSearchTerm,
}))(AdvancedSearchBox);
