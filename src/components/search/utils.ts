type SearchFieldValue = {
  raw?: unknown;
  snippet?: string;
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
