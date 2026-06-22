import type { ResultViewProps } from "@elastic/react-search-ui-views";
import {
  formatPublicationType,
  formatPublicationYear,
  normalizeText,
} from "../../../utils/Utils";
import type { Author, Conference, OrgUnit } from "../../types/Entities";
import { useDisplayFieldVisibility } from "./DisplayFieldsContext";

const CustomResultViewPublications = ({
  result,
  onClickLink,
}: ResultViewProps) => {
  const isVisible = useDisplayFieldVisibility();

  return (
    <li className="sui-result">
      <a onClick={onClickLink} href={`/publications/${result.id.raw}`}>
        <h2
          dangerouslySetInnerHTML={{
            __html: normalizeText(result.title?.snippet || result.title.raw),
          }}
        ></h2>
        <div className="result-metadata">
          {isVisible("author") && result.author?.raw && (
            <span>
              {result.author?.raw?.map((author: Author) => (
                <span key={author.id}>{normalizeText(author.name)}</span>
              ))}
            </span>
          )}
          {isVisible("journal") &&
            result.journal?.raw?.map((journal: any) => (
              <span key={journal.id}>
                {" "}
                {normalizeText(journal.title ? journal.title : journal)}
              </span>
            ))}
          {isVisible("conference") &&
            result.conference?.raw?.map((conference: Conference) =>
              conference.name?.map((name: string) => (
                <span key={name}>{normalizeText(name)}</span>
              )),
            )}
          {isVisible("sponsorOrgUnit") &&
            result.sponsorOrgUnit?.raw?.map((org: OrgUnit) => (
              <span key={org.id}>{normalizeText(org.name!)}</span>
            ))}
          {isVisible("publicationDate") && result.publicationDate?.raw && (
            <span>{formatPublicationYear(result.publicationDate.raw)}</span>
          )}
          {isVisible("type") && result.type?.raw && (
            <span>{normalizeText(formatPublicationType(result.type.raw))}</span>
          )}
        </div>
      </a>
    </li>
  );
};

export default CustomResultViewPublications;
