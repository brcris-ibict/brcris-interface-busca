import type { ResultViewProps } from "@elastic/react-search-ui-views";
import { useTranslation } from "next-i18next";
import { normalizeText } from "../../../utils/Utils";
import { withBasePath } from "../../lib/basePath";
import type { Author } from "../../types/Entities";
import { useDisplayFieldVisibility } from "./DisplayFieldsContext";

const CustomResultViewPatents = ({ result, onClickLink }: ResultViewProps) => {
  const { t } = useTranslation("common");
  const isVisible = useDisplayFieldVisibility();

  return (
    <li className="sui-result">
      <a onClick={onClickLink} href={withBasePath(`/patents/${result.id.raw}`)}>
        <h2
          dangerouslySetInnerHTML={{
            __html: normalizeText(result.title.snippet || result.title.raw),
          }}
        ></h2>
        <div className="result-metadata">
          {isVisible("inventor") && result.inventor?.raw && (
            <span>
              {result.inventor?.raw?.map((inventor: Author) => (
                <span key={inventor.id}>{normalizeText(inventor.name)}</span>
              ))}
            </span>
          )}
          {isVisible("kindCode") && result.kindCode?.raw && (
            <span>{result.kindCode?.raw}</span>
          )}
          {isVisible("countryCode") && result.countryCode?.raw && (
            <span>{result.countryCode?.raw}</span>
          )}
          {isVisible("depositDate") && result.depositDate?.raw && (
            <span>{`${t("Deposit")} ${result.depositDate?.raw}`}</span>
          )}
          {isVisible("publicationDate") && result.publicationDate?.raw && (
            <span>{`${t("Publication")} ${result.publicationDate?.raw}`}</span>
          )}
        </div>
      </a>
    </li>
  );
};

export default CustomResultViewPatents;
