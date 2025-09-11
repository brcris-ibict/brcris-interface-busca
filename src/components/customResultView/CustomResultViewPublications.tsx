import { ResultViewProps } from '@elastic/react-search-ui-views';
import { Author, OrgUnit, Service } from '../../types/Entities';

const CustomResultViewPublications = ({ result, onClickLink }: ResultViewProps) => {
  return (
    <li className="sui-result">
      <a onClick={onClickLink} href={`/publications/${result.id.raw}`}>
        <h3>{result.title?.raw}</h3>
        <div className="result-metadata">
          {result.author?.raw && (
            <span>{result.author?.raw?.map((author: Author) => <span key={author.id}>{author.name}</span>)}</span>
          )}
          {result.journal?.raw.map((journal: any, index: any) => (
            <span key={index}> {journal.title ? journal.title : journal}</span>
          ))}
          {result.service?.raw.map((service: Service) =>
            service.title?.map((title: string) => <span key={title}>{title}</span>)
          )}
          {result.orgunit?.raw.map((org: OrgUnit) => <span key={org.id}>{org.name!}</span>)}
          {result.publicationDate?.raw && <span>{result.publicationDate?.raw}</span>}
        </div>
      </a>
    </li>
  );
};

export default CustomResultViewPublications;
