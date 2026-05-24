import { getNumericLattesId } from "../../../utils/Utils";
import { getFieldTextValue, type SearchResultRecord } from "./utils";

type SearchTableCellProps = {
  entityKey: string;
  fieldKey: string;
  result: SearchResultRecord;
};

export default function SearchTableCell({
  entityKey,
  fieldKey,
  result,
}: SearchTableCellProps) {
  const fieldTextValue = getFieldTextValue(result, fieldKey);
  const sanitizedLattesId =
    entityKey === "people" && fieldKey === "lattesId"
      ? getNumericLattesId(fieldTextValue)
      : "";

  if (
    entityKey === "people" &&
    fieldKey === "orcid" &&
    fieldTextValue !== "-"
  ) {
    return (
      <a
        href={`https://orcid.org/${fieldTextValue}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        {fieldTextValue}
      </a>
    );
  }

  if (entityKey === "people" && fieldKey === "lattesId" && sanitizedLattesId) {
    return (
      <a
        href={`http://lattes.cnpq.br/${sanitizedLattesId}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        {sanitizedLattesId}
      </a>
    );
  }

  if (entityKey === "people" && fieldKey === "lattesId") {
    return "-";
  }

  return fieldTextValue;
}
