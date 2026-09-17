import type { ResultViewProps } from "@elastic/react-search-ui-views";
import { normalizeText } from "../../../utils/Utils";
import { withBasePath } from "../../lib/basePath";
import type { Publisher, ResearchArea } from "../../types/Entities";
import { useDisplayFieldVisibility } from "./DisplayFieldsContext";

const CustomResultViewJournals = ({ result, onClickLink }: ResultViewProps) => {
  const isVisible = useDisplayFieldVisibility();

  return (
    <li className="sui-result">
      <a
        onClick={onClickLink}
        href={withBasePath(`/journals/${result.id.raw}`)}
      >
        <h2
          dangerouslySetInnerHTML={{
            __html: normalizeText(result.title.snippet || result.title.raw),
          }}
        ></h2>
        <div className="result-metadata">
          {isVisible("publisher") &&
            result.publisher?.raw?.map((publisher: Publisher) => (
              <span key={publisher.id}>
                {normalizeText(publisher.name ?? "")}
              </span>
            ))}
          {isVisible("researchArea") &&
            result.researchArea?.raw?.map((researchArea: ResearchArea) => {
              const names = Array.isArray(researchArea.name)
                ? researchArea.name.join(", ")
                : String(researchArea.name ?? "");
              if (!names) return null;
              return <span key={researchArea.id}>{normalizeText(names)}</span>;
            })}
          {isVisible("issn_l") && result.issn_l?.raw && (
            <span>{result.issn_l.raw}</span>
          )}
          {isVisible("countryCode") && result.countryCode?.raw && (
            <span>{result.countryCode.raw}</span>
          )}
          {isVisible("isOA") && result.isOA?.raw !== undefined && (
            <span>{String(result.isOA.raw)}</span>
          )}
        </div>
      </a>
    </li>
  );
};

export default CustomResultViewJournals;
