import type { ResultViewProps } from "@elastic/react-search-ui-views";
import { formatPt } from "../../../utils/Utils";
import type { Author, OrgUnit } from "../../types/Entities";

const CustomResultViewGroups = ({ result, onClickLink }: ResultViewProps) => {
  return (
    <li className="sui-result">
      <a onClick={onClickLink} href={`/research-groups/${result.id.raw}`}>
        <h2
          dangerouslySetInnerHTML={{
            __html: formatPt(result.name?.snippet) || formatPt(result.name.raw),
          }}
        ></h2>
        <div className="result-metadata">
          {result.leaderResearcher?.raw && (
            <span>
              {result.leaderResearcher?.raw?.map((leaderResearcher: Author) => (
                <span key={leaderResearcher.id}>
                  {formatPt(leaderResearcher.name)}
                </span>
              ))}
            </span>
          )}
          {result.leaderOrgUnit?.raw.map((leaderOrgUnit: OrgUnit) => (
            <span key={leaderOrgUnit.id}>{formatPt(leaderOrgUnit.name)}</span>
          ))}
          {result.researchLine?.raw && (
            <span className="limit-text-1-line ">
              {formatPt(result.researchLine?.raw)}
            </span>
          )}
        </div>
      </a>
    </li>
  );
};

export default CustomResultViewGroups;
