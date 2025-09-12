import { ResultViewProps } from '@elastic/react-search-ui-views';
import { Author } from '../../types/Entities';

const CustomResultViewSoftwares = ({ result, onClickLink }: ResultViewProps) => {
  return (
    <li className="sui-result">
      <a onClick={onClickLink} href={`/software/${result.id.raw}`}>
        <h3
          dangerouslySetInnerHTML={{
            __html: result.name?.snippet || result.name.raw,
          }}
        ></h3>
        <div className="result-metadata">
          {result.creator?.raw && (
            <span>{result.creator?.raw?.map((creator: Author) => <span key={creator.id}>{creator.name}</span>)}</span>
          )}
          {result.description?.raw && <span className="limit-text-1-line">{result.description?.raw}</span>}
          {result.releaseYear?.raw && <span>{result.releaseYear?.raw}</span>}
        </div>
      </a>
    </li>
  );
};

export default CustomResultViewSoftwares;
