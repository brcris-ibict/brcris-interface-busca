import type { ResultViewProps } from "@elastic/react-search-ui-views";
import { useMemo } from "react";
import { normalizeText } from "../../../utils/Utils";
import type { OrgUnit } from "../../types/Entities";
import {
  getFieldTextValue,
  hasFieldValue,
  type SearchResultRecord,
} from "../search/utils";
import { useDisplayFieldVisibility } from "./DisplayFieldsContext";

const CustomResultViewGroups = ({ result, onClickLink }: ResultViewProps) => {
  const isVisible = useDisplayFieldVisibility();
  const record = result as SearchResultRecord;
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
          {isVisible("leaderResearcher") &&
            hasFieldValue(record, "leaderResearcher") && (
              <span>{getFieldTextValue(record, "leaderResearcher")}</span>
            )}
          {isVisible("orgUnit") &&
            result.orgUnit?.raw?.map((orgUnit: OrgUnit) => (
              <span key={orgUnit.id}>{normalizeText(orgUnit.name ?? "")}</span>
            ))}
          {isVisible("leaderOrgUnit") &&
            result.leaderOrgUnit?.raw?.map((leaderOrgUnit: OrgUnit) => (
              <span key={leaderOrgUnit.id}>
                {normalizeText(leaderOrgUnit.name ?? "")}
              </span>
            ))}
          {isVisible("researchLine") && result.researchLine?.raw && (
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
