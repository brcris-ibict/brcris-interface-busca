import type { ResultViewProps } from "@elastic/react-search-ui-views";
import type { Publisher, ResearchArea } from "../../types/Entities";

const CustomResultViewJournals = ({ result, onClickLink }: ResultViewProps) => {
  return (
    <li className="sui-result">
      <a onClick={onClickLink} href={`/journals/${result.id.raw}`}>
        <h3
          dangerouslySetInnerHTML={{
            __html: result.title.snippet || result.title.raw,
          }}
        ></h3>
        <div className="result-metadata">
          {result.publisher?.raw.map((publisher: Publisher) => (
            <span key={publisher.id}>{publisher.name!}</span>
          ))}
          {result.researchArea?.raw.map((researchArea: ResearchArea) => (
            <span key={researchArea.id}>{researchArea.name!}</span>
          ))}
        </div>
      </a>
    </li>
  );
};

export default CustomResultViewJournals;
