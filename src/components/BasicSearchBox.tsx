/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <explanation> */
import { Search } from "lucide-react";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { type FormEvent, useEffect, useState } from "react";
import indexes from "../configs/Indexes";
import { getIndexStats } from "../services/ElasticSearchStatsService";

export type BasicSearchBoxProps = {
  titleFieldName: string;
  indexLabel: string;
  setSearchTerm: (searchTerm: string) => void;
  handleSelectIndex: (event: any) => void;
};

const BasicSearchBox = ({
  indexLabel,
  setSearchTerm,
  handleSelectIndex,
}: BasicSearchBoxProps) => {
  const { t } = useTranslation("common");
  const router = useRouter();
  const [docsCount, setDocsCount] = useState(
    typeof window !== "undefined" ? localStorage.getItem(indexLabel) : null,
  );
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    getIndexStats(indexLabel, setDocsCount);
  }, [indexLabel]);

  useEffect(() => {
    const queryValue = router.query.q;
    const normalizedQuery = Array.isArray(queryValue)
      ? (queryValue[0] ?? "")
      : (queryValue ?? "");

    setInputValue(normalizedQuery);
    setSearchTerm(normalizedQuery);
  }, [indexLabel, router.query.q, setSearchTerm]);

  const placeholder = `${t("Enter at least 3 characters and search among")} ${t(
    "numberFormat",
    {
      value: docsCount || 0,
    },
  )} ${t(indexLabel)}`;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedValue = inputValue.trim();
    if (normalizedValue.length < 3) {
      return;
    }

    setSearchTerm(normalizedValue);
    router.push({
      pathname: router.pathname,
      query: {
        ...router.query,
        q: normalizedValue,
      },
    });
  };

  return (
    <form className="form-search" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="index-select" className="visually-hidden">
          {t("Select an entity")}
        </label>

        <div className="custom-select">
          <select
            defaultValue={indexLabel}
            id="index-select"
            onChange={(event) => {
              setInputValue("");
              setSearchTerm("");
              handleSelectIndex(event);
            }}
          >
            {indexes.map((index) => (
              <option key={index.label} value={index.label}>
                {t(index.label)}
              </option>
            ))}
          </select>
        </div>

        <label htmlFor="basic-search-input" className="visually-hidden">
          {t("Search")}
        </label>

        <input
          id="basic-search-input"
          type="search"
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          placeholder={placeholder}
        />
      </div>

      <button
        type="submit"
        disabled={inputValue.trim().length < 3}
        className="btn btn-primary search-button"
      >
        <Search /> {t("Search")}
      </button>
    </form>
  );
};

export default BasicSearchBox;
