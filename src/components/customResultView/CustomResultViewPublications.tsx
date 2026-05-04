import type { ResultViewProps } from "@elastic/react-search-ui-views";
import type { Author, Conference, OrgUnit } from "../../types/Entities";

const CustomResultViewPublications = ({
  result,
  onClickLink,
}: ResultViewProps) => {
  return (
    <li className="sui-result">
      <a onClick={onClickLink} href={`/publications/${result.id.raw}`}>
        <h2
          dangerouslySetInnerHTML={{
            __html: result.title?.snippet || result.title.raw,
          }}
        ></h2>
        <div className="result-metadata">
          {result.author?.raw && (
            <span>
              {result.author?.raw?.map((author: Author) => (
                <span key={author.id}>{author.name}</span>
              ))}
            </span>
          )}
          {result.journal?.raw.map((journal: any) => (
            <span key={journal.id}>
              {" "}
              {journal.title ? journal.title : journal}
            </span>
          ))}
          {result.conference?.raw.map((conference: Conference) =>
            conference.name?.map((name: string) => (
              <span key={name}>{name}</span>
            )),
          )}
          {result.sponsorOrgUnit?.raw.map((org: OrgUnit) => (
            <span key={org.id}>{org.name!}</span>
          ))}
          {result.publicationDate?.raw && (
            <span>{result.publicationDate?.raw}</span>
          )}
        </div>
      </a>
    </li>
  );
};

export default CustomResultViewPublications;
