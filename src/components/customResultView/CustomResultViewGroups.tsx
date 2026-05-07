import type { ResultViewProps } from "@elastic/react-search-ui-views";
import { useMemo } from "react";
import { normalizeText } from "../../../utils/Utils";
import type { Author, OrgUnit } from "../../types/Entities";

const CustomResultViewGroups = ({ result, onClickLink }: ResultViewProps) => {
  const name = result.name?.snippet || result.name.raw;
  const normalizedName = useMemo(() => normalizeText(name), [name]);

  return (
    <li className="sui-result">
      <a onClick={onClickLink} href={`/research-groups/${result.id.raw}`}>
        <h2
          dangerouslySetInnerHTML={{
            __html: normalizedName,
          }}
        ></h2>
        <div className="result-metadata">
          {result.leaderResearcher?.raw && (
            <span>
              {result.leaderResearcher?.raw?.map((leaderResearcher: Author) => (
                <span key={leaderResearcher.id}>
                  {normalizeText(leaderResearcher.name)}
                </span>
              ))}
            </span>
          )}
          {result.leaderOrgUnit?.raw.map((leaderOrgUnit: OrgUnit) => (
            <span key={leaderOrgUnit.id}>
              {normalizeText(leaderOrgUnit.name)}
            </span>
          ))}
          {result.researchLine?.raw && (
            <span className="limit-text-1-line ">
              {normalizeText(result.researchLine?.raw)}
            </span>
          )}
        </div>
      </a>
    </li>
  );
};

export default CustomResultViewGroups;
