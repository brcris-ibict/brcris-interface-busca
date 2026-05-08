import type { ResultViewProps } from "@elastic/react-search-ui-views";
import { normalizeText } from "../../../utils/Utils";

const CustomResultViewOrganizations = ({
  result,
  onClickLink,
}: ResultViewProps) => {
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
          {result.city?.raw && <span>{normalizeText(result.city?.raw)}</span>}
          {result.state?.raw && <span>{normalizeText(result.state?.raw)}</span>}
          {result.country?.raw && (
            <span>{normalizeText(result.country?.raw)}</span>
          )}
        </div>
      </a>
    </li>
  );
};

export default CustomResultViewOrganizations;
