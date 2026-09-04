import { useSearch } from "@elastic/react-search-ui";
import type { ResultViewProps } from "@elastic/react-search-ui-views";
import { useMemo } from "react";
import { useTranslation } from "next-i18next";
import { normalizeText } from "../../../utils/Utils";
import { useLibraryInstitutions } from "../../hooks/useLibraryInstitutions";
import { withBasePath } from "../../lib/basePath";
import { ORG_LIBRARY_TYPE } from "../../lib/orgunitSearchQuery";
import { useDisplayFieldVisibility } from "./DisplayFieldsContext";

function asText(value: unknown): string {
  if (Array.isArray(value)) return String(value[0] ?? "");
  if (value == null) return "";
  return String(value);
}

function isLibraryType(typeValue: unknown): boolean {
  if (Array.isArray(typeValue)) {
    return typeValue.some((item) => String(item) === ORG_LIBRARY_TYPE);
  }
  return String(typeValue ?? "") === ORG_LIBRARY_TYPE;
}

const CustomResultViewOrganizations = ({
  result,
  onClickLink,
}: ResultViewProps) => {
  const isVisible = useDisplayFieldVisibility();
  const { t } = useTranslation("common");
  const { results } = useSearch();

  const libraryIds = useMemo(() => {
    return (results || [])
      .filter((item) => isLibraryType(item.type?.raw))
      .map((item) => asText(item.id?.raw))
      .filter(Boolean);
  }, [results]);

  const { data: institutionByLibrary } = useLibraryInstitutions(libraryIds);

  const isLibrary = isLibraryType(result.type?.raw);
  const resultId = asText(result.id?.raw);
  const institution = resultId ? institutionByLibrary[resultId] : undefined;

  return (
    <li className="sui-result">
      <a
        onClick={onClickLink}
        href={withBasePath(`/organizations/${result.id.raw}`)}
      >
        <h2
          dangerouslySetInnerHTML={{
            __html:
              normalizeText(result.name.snippet || result.name.raw) +
              (result.acronym?.raw ? ` (${result.acronym?.raw})` : ""),
          }}
        ></h2>
        <div className="result-metadata">
          {isVisible("type") && result.type?.raw && (
            <span>{normalizeText(result.type?.raw)}</span>
          )}
          {isLibrary ? (
            institution?.name ? (
              <span>
                {t("Institution")}: {normalizeText(institution.name)}
              </span>
            ) : null
          ) : (
            <>
              {isVisible("city") && result.city?.raw && (
                <span>{normalizeText(result.city?.raw)}</span>
              )}
              {isVisible("state") && result.state?.raw && (
                <span>{normalizeText(result.state?.raw)}</span>
              )}
              {isVisible("country") && result.country?.raw && (
                <span>{normalizeText(result.country?.raw)}</span>
              )}
            </>
          )}
        </div>
      </a>
    </li>
  );
};

export default CustomResultViewOrganizations;
