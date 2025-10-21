import type { ResultViewProps } from "@elastic/react-search-ui-views";
import { useTranslation } from "next-i18next";

const CustomResultViewCourses = ({ result, onClickLink }: ResultViewProps) => {
  const { t } = useTranslation("common");

  return (
    <li className="sui-result">
      <a onClick={onClickLink} href={`/courses/${result.id.raw}`}>
        <h3
          dangerouslySetInnerHTML={{
            __html: result.name?.snippet || result.name?.raw || "",
          }}
        ></h3>

        <div className="result-metadata">
          {result.degree?.raw && (
            <span>{`${t("Degree")}: ${result.degree.raw}`}</span>
          )}

          {result.type?.raw && (
            <span>{`${t("Type")}: ${result.type.raw}`}</span>
          )}

          {result.startDate?.raw && (
            <span>{`${t("Start")}: ${result.startDate.raw}`}</span>
          )}

          {result.endDate?.raw && (
            <span>{`${t("End")}: ${result.endDate.raw}`}</span>
          )}

          {result.program?.raw && result.program.raw.length > 0 && (
            <span>
              {t("Program")}
              {result.program.raw
                .map((p: { name: string }) => p.name)
                .join(", ")}
            </span>
          )}

          {result.orgUnit?.raw && result.orgUnit.raw.length > 0 && (
            <div className="sui-result__item">
              <span className="sui-result__key">
                {t("Organizational Unit")}:
              </span>{" "}
              <span className="sui-result__value">
                {result.orgUnit.raw
                  .map((o: { name: string }) => o.name)
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
