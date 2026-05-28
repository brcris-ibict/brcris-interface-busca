import { getLattesIdentifier, getNumericLattesId } from "../../../utils/Utils";

type SearchFieldValue = {
  raw?: unknown;
  snippet?: string;
};

type TableStyles = {
  peopleNameColumn?: string;
  organizationsNameColumn?: string;
  researchGroupsNameColumn?: string;
  journalsTitleColumn?: string;
  peopleGroupsColumn?: string;
  researchGroupsLeaderColumn?: string;
  researchGroupsLineColumn?: string;
};

export const isNameBasedEntity = (entityKey: string) =>
  entityKey === "people" ||
  entityKey === "organizations" ||
  entityKey === "research-groups" ||
  entityKey === "courses";

export const getTitleFieldName = (entityKey: string) =>
  isNameBasedEntity(entityKey) ? "name" : "title";

export const getPrimaryColumnClassName = (
  entityKey: string,
  styles: TableStyles,
) => {
  if (entityKey === "people") return styles.peopleNameColumn;
  if (entityKey === "organizations") return styles.organizationsNameColumn;
  if (entityKey === "research-groups") return styles.researchGroupsNameColumn;
  if (entityKey === "journals") return styles.journalsTitleColumn;
  return undefined;
};

export const getFieldColumnClassName = (
  entityKey: string,
  fieldKey: string,
  styles: TableStyles,
) => {
  if (entityKey === "people" && fieldKey === "memberOf") {
    return styles.peopleGroupsColumn;
  }
  if (entityKey === "research-groups" && fieldKey === "leaderResearcher") {
    return styles.researchGroupsLeaderColumn;
  }
  if (entityKey === "research-groups" && fieldKey === "researchLine") {
    return styles.researchGroupsLineColumn;
  }
  return undefined;
};

export type SearchResultRecord = Record<string, SearchFieldValue | undefined>;

const stripHtmlTags = (value: string) => value.replace(/<[^>]+>/g, "").trim();

export const stringifyValue = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => stringifyValue(item))
      .filter(Boolean)
      .join(", ");
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const preferredKeys = ["name", "title", "label", "acronym"];

    for (const key of preferredKeys) {
      const preferredText = stringifyValue(record[key]);
      if (preferredText) return preferredText;
    }

    const nestedRaw = (record as { raw?: unknown }).raw;
    if (nestedRaw !== undefined) return stringifyValue(nestedRaw);

    const idValue = record.id;
    if (typeof idValue === "string" || typeof idValue === "number") {
      return String(idValue);
    }
  }
  return "";
};

export const getFieldTextValue = (result: SearchResultRecord, key: string) => {
  const fieldValue = result[key];
  if (!fieldValue) return "-";

  if (typeof fieldValue.snippet === "string" && fieldValue.snippet.trim()) {
    const snippetText = stripHtmlTags(fieldValue.snippet);
    if (snippetText) return snippetText;
  }

  const rawText = stringifyValue(fieldValue.raw);
  return rawText || "-";
};

export const getResultTitle = (result: SearchResultRecord) => {
  const preferredKeys = ["title", "name", "acronym", "id"];
  for (const key of preferredKeys) {
    const value = getFieldTextValue(result, key);
    if (value && value !== "-") {
      return value;
    }
  }
  return "-";
};

export const hasFieldValue = (result: SearchResultRecord, key: string) => {
  const value = getFieldTextValue(result, key);
  return value !== "" && value !== "-";
};

export const formatResearchAreaLabel = (
  name: string | string[] | undefined,
) => {
  if (!name) return "";
  if (Array.isArray(name)) {
    return name.filter(Boolean).join(", ");
  }
  return String(name);
};

export const getLattesIdFromRecord = (result: SearchResultRecord): string => {
  const raw = result.lattesId?.raw;
  if (raw === null || raw === undefined) return "";
  if (Array.isArray(raw)) {
    const identifier = getLattesIdentifier(raw as string[]);
    if (identifier) return getNumericLattesId(identifier);
    return getNumericLattesId(raw);
  }
  return getNumericLattesId(raw);
};
