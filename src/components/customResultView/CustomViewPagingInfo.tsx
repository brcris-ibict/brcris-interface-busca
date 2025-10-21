import type { PagingInfoViewProps } from "@elastic/react-search-ui-views";
import { useTranslation } from "next-i18next";

function CustomViewPagingInfo({
  className,
  end,
  searchTerm,
  start,
  totalResults,
}: PagingInfoViewProps & React.HTMLAttributes<HTMLDivElement>) {
  const { t } = useTranslation(["common", "format"]);
  const formattedNumber = t("numberFormat", { value: totalResults });
  return (
    <div className={`sui-paging-info ${className}`}>
      {t("Showing")}{" "}
      <strong>
        {start} - {end}
      </strong>{" "}
      {t("out of")} <strong>{formattedNumber}</strong>{" "}
      {searchTerm && (
        <>
          {t("for")}: <em>{searchTerm}</em>
        </>
      )}
    </div>
  );
}

export default CustomViewPagingInfo;
