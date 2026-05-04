/* eslint-disable react-hooks/exhaustive-deps */
/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <explanation> */
import { SearchBox } from "@elastic/react-search-ui";
import { Search } from "lucide-react";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { useEffect, useState } from "react";
import indexes from "../configs/Indexes";
import { getIndexStats } from "../services/ElasticSearchStatsService";

export type BasicSearchBoxProps = {
  titleFieldName: string;
  indexLabel: string;
  setSearchTerm: (searchTerm: string) => void;
  handleSelectIndex: (event: any) => void;
};

const BasicSearchBox = ({
  titleFieldName,
  indexLabel,
  setSearchTerm,
  handleSelectIndex,
}: BasicSearchBoxProps) => {
  const { t } = useTranslation("common");
  const router = useRouter();
  const [docsCount, setDocsCount] = useState(
    typeof window !== "undefined" ? localStorage.getItem(indexLabel) : null,
  );

  useEffect(() => {
    getIndexStats(indexLabel, setDocsCount);
  }, []);

  return (
    <SearchBox
      autocompleteMinimumCharacters={3}
      searchAsYouType={false}
      autocompleteResults={{
        linkTarget: "_blank",
        sectionTitle: t("Open link") || "",
        titleField: titleFieldName,
        urlField: "",
        shouldTrackClickThrough: true,
      }}
      autocompleteSuggestions={false}
      debounceLength={0}
      onSubmit={(searchTerm) => {
        setSearchTerm(searchTerm);
      }}
      onSelectAutocomplete={(
        selection: any,
        item: any,
        defaultOnSelectAutocomplete: any,
      ) => {
        if (selection.suggestion) {
          selection.suggestion = `"${selection.suggestion}"`;
          defaultOnSelectAutocomplete(selection);
        } else {
          router.push(`${indexLabel.toLowerCase()}/${selection.id.raw}`);
        }
      }}
      inputView={({ getAutocomplete, getInputProps }) => (
        <div className="form-search">
          <div className="form-group">
            <label htmlFor="index-select" className="visually-hidden">
              {t("Select an entity")}
            </label>

            <div className="custom-select">
              <select
                defaultValue={indexLabel}
                id="index-select"
                onChange={handleSelectIndex}
              >
                {indexes.map((index) => (
                  <option key={index.label} value={index.label}>
                    {t(index.label)}
                  </option>
                ))}
              </select>
            </div>

            {/* Label invisível para o input */}
            <label htmlFor="basic-search-input" className="visually-hidden">
              {t("Search")}
            </label>

            <input
              id="basic-search-input"
              {...getInputProps({
                placeholder: `${t(
                  "Enter at least 3 characters and search among",
                )} ${t("numberFormat", {
                  value: docsCount || 0,
                })} ${t(indexLabel)}`,
              })}
            />

            {getAutocomplete()}
          </div>

          <button
            type="submit"
            disabled={getInputProps()?.value?.trim().length < 3}
            className="btn btn-primary search-button"
          >
            <Search /> {t("Search")}
          </button>
        </div>
      )}
    />
  );
};

export default BasicSearchBox;
