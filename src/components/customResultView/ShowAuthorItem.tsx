import type { Author } from "../../types/Entities";
import AuthorLink from "../externalLinks/AuthorLink";

interface ShowAuthorItemProps {
  label: string;
  authors: Author | Author[];
}

const ShowAuthorItem = ({ label, authors }: ShowAuthorItemProps) => {
  return authors === undefined || authors === null ? null : (
    <li>
      <span className="sui-result__key">{label}</span>
      <span className="sui-result__value">
        {Array.isArray(authors) ? (
          authors?.map((author: Author) => (
            <AuthorLink
              key={author.id}
              id={author.id}
              name={author.name}
              idLattes={author.idLattes}
            />
          ))
        ) : (
          <AuthorLink
            key={authors?.id}
            id={authors?.id}
            name={authors?.name}
            idLattes={authors?.idLattes}
          />
        )}
      </span>
    </li>
  );
};

export default ShowAuthorItem;
