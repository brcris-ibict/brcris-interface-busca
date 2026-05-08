import type { ResultViewProps } from "@elastic/react-search-ui-views";
import { normalizeText } from "../../../utils/Utils";
import type { OrgUnit, ResearchArea } from "../../types/Entities";

const CustomResultViewPeople = ({ result, onClickLink }: ResultViewProps) => {
  return (
    <li className="sui-result">
      <a onClick={onClickLink} href={`/programs/${result.id.raw}`}>
        <h2
          dangerouslySetInnerHTML={{
            __html: normalizeText(result.name?.snippet || result.name?.raw),
          }}
        ></h2>
        <div className="result-metadata">
          {result.orgUnit?.raw.map((org: OrgUnit) => (
            <span key={org.id}>{org.name!}</span>
          ))}
          {result.researchArea?.raw.map((researchArea: ResearchArea) =>
            researchArea.name?.map((name: string) => (
              <span key={name}>{name}</span>
            )),
          )}
        </div>
      </a>
    </li>
  );
};

export default CustomResultViewPeople;
