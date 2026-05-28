import type { ResultViewProps } from "@elastic/react-search-ui-views";
import { normalizeText } from "../../../utils/Utils";
import type { Author } from "../../types/Entities";
import { useDisplayFieldVisibility } from "./DisplayFieldsContext";

const CustomResultViewSoftwares = ({
  result,
  onClickLink,
}: ResultViewProps) => {
  const isVisible = useDisplayFieldVisibility();

  return (
    <li className="sui-result">
      <a onClick={onClickLink} href={`/software/${result.id.raw}`}>
        <h2
          dangerouslySetInnerHTML={{
            __html: normalizeText(result.title?.snippet || result.title.raw),
          }}
        ></h2>
        <div className="result-metadata">
          {isVisible("creator") && result.creator?.raw && (
            <span>
              {result.creator?.raw?.map((creator: Author) => (
                <span key={creator.id}>{normalizeText(creator.name)}</span>
              ))}
            </span>
          )}
          {isVisible("description") && result.description?.raw && (
            <span className="limit-text-1-line">
              {normalizeText(result.description?.raw)}
            </span>
          )}
          {isVisible("releaseYear") && result.releaseYear?.raw && (
            <span>{result.releaseYear?.raw}</span>
          )}
        </div>
      </a>
    </li>
  );
};

export default CustomResultViewSoftwares;
