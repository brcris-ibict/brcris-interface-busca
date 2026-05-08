/* eslint-disable  @typescript-eslint/no-non-null-asserted-optional-chain */
/* eslint-disable  @typescript-eslint/no-non-null-asserted-optional-chain */
import type { ResultViewProps } from "@elastic/react-search-ui-views";
import { normalizeText } from "../../../utils/Utils";
import type { OrgUnit } from "../../types/Entities";

const CustomResultViewPeople = ({ result, onClickLink }: ResultViewProps) => {
  return (
    <li className="sui-result">
      <a onClick={onClickLink} href={`/people/${result.id.raw}`}>
        <h2
          dangerouslySetInnerHTML={{
            __html: normalizeText(result.name.snippet || result.name.raw),
          }}
        ></h2>
        <div className="result-metadata">
          {result.affiliation?.raw.map((affiliation: OrgUnit) => (
            <span key={affiliation.id}>{normalizeText(affiliation.name!)}</span>
          ))}
        </div>
      </a>
    </li>
  );
};

export default CustomResultViewPeople;
