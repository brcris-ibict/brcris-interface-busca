import type { ResultViewProps } from "@elastic/react-search-ui-views";
import { normalizeText } from "../../../utils/Utils";
import { withBasePath } from "../../lib/basePath";
import type { OrgUnit } from "../../types/Entities";
import {
  getFieldTextValue,
  getLattesIdFromRecord,
  hasFieldValue,
  type SearchResultRecord,
} from "../search/utils";
import { useDisplayFieldVisibility } from "./DisplayFieldsContext";

const CustomResultViewPeople = ({ result, onClickLink }: ResultViewProps) => {
  const isVisible = useDisplayFieldVisibility();
  const record = result as SearchResultRecord;
  const lattesId = getLattesIdFromRecord(record);
  const orcidId = typeof result.orcid?.raw === "string" ? result.orcid.raw : "";

  return (
    <li className="sui-result">
      <a onClick={onClickLink} href={withBasePath(`/people/${result.id.raw}`)}>
        <h2
          dangerouslySetInnerHTML={{
            __html: normalizeText(result.name.snippet || result.name.raw),
          }}
        ></h2>
      </a>
      <div className="result-metadata">
        {isVisible("affiliation") &&
          result.affiliation?.raw?.map((affiliation: OrgUnit) => (
            <span key={affiliation.id}>{normalizeText(affiliation.name!)}</span>
          ))}
        {isVisible("orcid") && orcidId && (
          <span>
            <a
              href={`https://orcid.org/${orcidId}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {orcidId}
            </a>
          </span>
        )}
        {isVisible("lattesId") && lattesId && (
          <span>
            <a
              href={`http://lattes.cnpq.br/${lattesId}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {lattesId}
            </a>
          </span>
        )}
        {isVisible("memberOf") && hasFieldValue(record, "memberOf") && (
          <span>{normalizeText(getFieldTextValue(record, "memberOf"))}</span>
        )}
      </div>
    </li>
  );
};

export default CustomResultViewPeople;
