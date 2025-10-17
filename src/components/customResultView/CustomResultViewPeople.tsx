/* eslint-disable  @typescript-eslint/no-non-null-asserted-optional-chain */
import type { ResultViewProps } from "@elastic/react-search-ui-views";
import type { OrgUnit } from "../../types/Entities";

const CustomResultViewPeople = ({ result, onClickLink }: ResultViewProps) => {
  return (
    <li className="sui-result">
      <a onClick={onClickLink} href={`/people/${result.id.raw}`}>
        <h3
          dangerouslySetInnerHTML={{
            __html: result.name.snippet || result.name.raw,
          }}
        ></h3>
        <div className="result-metadata">
          {result.affiliation?.raw.map((affiliation: OrgUnit) => (
            <span key={affiliation.id}>{affiliation.name!}</span>
          ))}
        </div>
      </a>
    </li>
  );
};

export default CustomResultViewPeople;
