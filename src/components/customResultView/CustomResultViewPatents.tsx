import type { ResultViewProps } from "@elastic/react-search-ui-views";
import { useTranslation } from "next-i18next";
import type { Author } from "../../types/Entities";

const CustomResultViewPatents = ({ result, onClickLink }: ResultViewProps) => {
  const { t } = useTranslation("common");
  return (
    <li className="sui-result">
      <a onClick={onClickLink} href={`/patents/${result.id.raw}`}>
        <h3
          dangerouslySetInnerHTML={{
            __html: result.title.snippet || result.title.raw,
          }}
        ></h3>
        <div className="result-metadata">
          {result.inventor?.raw && (
            <span>
              {result.inventor?.raw?.map((inventor: Author) => (
                <span key={inventor.id}>{inventor.name}</span>
              ))}
            </span>
          )}
          {result.kindCode?.raw && <span>{result.kindCode?.raw}</span>}
          {result.countryCode?.raw && <span>{result.countryCode?.raw}</span>}
          {result.depositDate?.raw && (
            <span>{`${t("Deposit")} ${result.depositDate?.raw}`}</span>
          )}
          {result.publicationDate?.raw && (
            <span>{`${t("Publication")} ${result.publicationDate?.raw}`}</span>
          )}
        </div>
      </a>
    </li>
  );
};

export default CustomResultViewPatents;
