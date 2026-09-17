import type { ResultViewProps } from "@elastic/react-search-ui-views";
import { normalizeText } from "../../../utils/Utils";
import { withBasePath } from "../../lib/basePath";
import type { OrgUnit, ResearchArea } from "../../types/Entities";
import { formatResearchAreaLabel } from "../search/utils";
import { useDisplayFieldVisibility } from "./DisplayFieldsContext";

const CustomResultViewPrograms = ({ result, onClickLink }: ResultViewProps) => {
  const isVisible = useDisplayFieldVisibility();

  return (
    <li className="sui-result">
      <a
        onClick={onClickLink}
        href={withBasePath(`/programs/${result.id.raw}`)}
      >
        <h2
          dangerouslySetInnerHTML={{
            __html: normalizeText(result.name?.snippet || result.name?.raw),
          }}
        ></h2>
        <div className="result-metadata">
          {isVisible("orgUnit") &&
            result.orgUnit?.raw?.map((org: OrgUnit) => (
              <span key={org.id}>{normalizeText(org.name ?? "")}</span>
            ))}
          {isVisible("researchArea") &&
            result.researchArea?.raw?.map((researchArea: ResearchArea) => {
              const label = formatResearchAreaLabel(researchArea.name);
              if (!label) return null;
              return <span key={researchArea.id}>{normalizeText(label)}</span>;
            })}
        </div>
      </a>
    </li>
  );
};

export default CustomResultViewPrograms;
