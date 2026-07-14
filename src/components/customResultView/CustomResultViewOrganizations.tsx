import type { ResultViewProps } from "@elastic/react-search-ui-views";
import { normalizeText } from "../../../utils/Utils";
import { useDisplayFieldVisibility } from "./DisplayFieldsContext";

const CustomResultViewOrganizations = ({
  result,
  onClickLink,
}: ResultViewProps) => {
  const isVisible = useDisplayFieldVisibility();

  return (
    <li className="sui-result">
      <a onClick={onClickLink} href={`/organizations/${result.id.raw}`}>
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
          {isVisible("city") && result.city?.raw && (
            <span>{normalizeText(result.city?.raw)}</span>
          )}
          {isVisible("state") && result.state?.raw && (
            <span>{normalizeText(result.state?.raw)}</span>
          )}
          {isVisible("country") && result.country?.raw && (
            <span>{normalizeText(result.country?.raw)}</span>
          )}
        </div>
      </a>
    </li>
  );
};

export default CustomResultViewOrganizations;
