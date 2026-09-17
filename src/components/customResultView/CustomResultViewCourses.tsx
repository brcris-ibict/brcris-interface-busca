import type { ResultViewProps } from "@elastic/react-search-ui-views";
import { useTranslation } from "next-i18next";
import { normalizeText } from "../../../utils/Utils";
import { withBasePath } from "../../lib/basePath";
import { useDisplayFieldVisibility } from "./DisplayFieldsContext";

const CustomResultViewCourses = ({ result, onClickLink }: ResultViewProps) => {
  const { t } = useTranslation("common");
  const isVisible = useDisplayFieldVisibility();

  return (
    <li className="sui-result">
      <a onClick={onClickLink} href={withBasePath(`/courses/${result.id.raw}`)}>
        <h3
          dangerouslySetInnerHTML={{
            __html: normalizeText(
              result.name?.snippet || result.name?.raw || "",
            ),
          }}
        ></h3>

        <div className="result-metadata">
          {isVisible("degree") && result.degree?.raw && (
            <span>{`${t("Degree")}: ${normalizeText(result.degree.raw)}`}</span>
          )}

          {isVisible("type") && result.type?.raw && (
            <span>{`${t("Type")}: ${normalizeText(result.type.raw)}`}</span>
          )}

          {isVisible("startDate") && result.startDate?.raw && (
            <span>{`${t("Start")}: ${result.startDate.raw}`}</span>
          )}

          {isVisible("endDate") && result.endDate?.raw && (
            <span>{`${t("End")}: ${result.endDate.raw}`}</span>
          )}

          {isVisible("program") &&
            result.program?.raw &&
            result.program.raw.length > 0 && (
              <span>
                {t("Program")}{" "}
                {result.program.raw
                  .map((p: { name: string }) => normalizeText(p.name))
                  .join(", ")}
              </span>
            )}

          {isVisible("orgUnit") &&
            result.orgUnit?.raw &&
            result.orgUnit.raw.length > 0 && (
              <div className="sui-result__item">
                <span className="sui-result__key">
                  {t("Organizational Unit")}:
                </span>{" "}
                <span className="sui-result__value">
                  {result.orgUnit.raw
                    .map((o: { name: string }) => normalizeText(o.name))
                    .join(", ")}
                </span>
              </div>
            )}
        </div>
      </a>
    </li>
  );
};

export default CustomResultViewCourses;
