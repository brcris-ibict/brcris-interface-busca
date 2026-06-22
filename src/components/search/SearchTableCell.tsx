import {
  formatFirstPublicationValue,
  formatPublicationType,
  formatPublicationYear,
} from "../../../utils/Utils";
import {
  getFieldTextValue,
  getLattesIdFromRecord,
  type SearchResultRecord,
} from "./utils";

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
      ? getLattesIdFromRecord(result)
      : "";
  const orcidId = typeof result.orcid?.raw === "string" ? result.orcid.raw : "";

  if (
    entityKey === "people" &&
    fieldKey === "orcid" &&
    fieldTextValue !== "-"
  ) {
    return (
      <a
        href={`https://orcid.org/${orcidId || fieldTextValue}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        {orcidId || fieldTextValue}
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

  if (entityKey === "publications" && fieldKey === "publicationDate") {
    const raw = result.publicationDate?.raw;
    if (raw === null || raw === undefined) return "-";
    const formatted = formatPublicationYear(raw);
    return formatted || "-";
  }

  if (entityKey === "publications" && fieldKey === "type") {
    const raw = result.type?.raw;
    if (raw === null || raw === undefined) return "-";
    const formatted = formatPublicationType(raw);
    return formatted || "-";
  }

  if (
    entityKey === "publications" &&
    (fieldKey === "edition" ||
      fieldKey === "volume" ||
      fieldKey === "issue" ||
      fieldKey === "language" ||
      fieldKey === "series")
  ) {
    const raw = result[fieldKey]?.raw;
    if (raw === null || raw === undefined) return "-";
    const formatted = formatFirstPublicationValue(raw);
    return formatted || "-";
  }

  return fieldTextValue;
}
