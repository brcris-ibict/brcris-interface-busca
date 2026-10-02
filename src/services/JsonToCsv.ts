import {
  formatPublicationType,
  formatPublicationYear,
} from "../../utils/Utils";

// Interface para opções de conversão
export interface CsvOptions {
  headers?: boolean;
  delimiter?: string;
  eol?: string;
}

export const csvOptions: CsvOptions = {
  delimiter: ";",
  eol: "\r\n",
};

export function escapeCsvCell(value: string): string {
  return value.replaceAll(";", ",");
}

export function sanitizeExportText(value: string): string {
  return value
    .replace(/\s+/g, " ")
    .replace(/^[,;|\s]+|[,;|\s]+$/g, "")
    .replace(/,\s*,+/g, ",")
    .replace(/\s*,\s*/g, ", ")
    .trim();
}

export function entityLabel(item: object): string {
  const rec = item as { name?: unknown; title?: unknown };
  const raw = rec.name ?? rec.title;
  if (Array.isArray(raw)) {
    return sanitizeExportText(
      raw
        .map((part) => String(part ?? "").trim())
        .filter(Boolean)
        .join(", "),
    );
  }
  return sanitizeExportText(String(raw ?? "").trim());
}

function normalizeAuthorName(item: unknown): string {
  const label =
    typeof item === "object" && item !== null
      ? entityLabel(item)
      : String(item ?? "").trim();
  return label.trim().toLowerCase().replace(/\s+/g, " ");
}

function getAuthorId(item: unknown): string {
  if (typeof item === "object" && item !== null) {
    return firstId((item as { id?: unknown }).id);
  }
  return "";
}

export function dedupePublicationAuthors(
  source: Record<string, unknown>,
): void {
  const author = source.author;
  if (author == null) return;
  const list = Array.isArray(author) ? author : [author];
  const seenIds = new Set<string>();
  const preferred = new Map<string, { item: unknown; index: number }>();
  const nameless: Array<{ item: unknown; index: number }> = [];

  for (let index = 0; index < list.length; index++) {
    const item = list[index];
    const id = getAuthorId(item);
    if (id) {
      if (seenIds.has(id)) continue;
      seenIds.add(id);
    }

    const name = normalizeAuthorName(item);
    if (!name) {
      nameless.push({ item, index });
      continue;
    }

    const current = preferred.get(name);
    if (!current) {
      preferred.set(name, { item, index });
      continue;
    }
    if (!getAuthorId(current.item) && id) {
      preferred.set(name, { item, index });
    }
  }

  source.author = [...preferred.values(), ...nameless]
    .sort((a, b) => a.index - b.index)
    .map((entry) => entry.item);
}

export function formatAuthorNames(value: unknown): string {
  const list = Array.isArray(value) ? value : value ? [value] : [];
  return list
    .map((item) => {
      if (typeof item === "object" && item !== null) {
        return entityLabel(item);
      }
      return sanitizeExportText(String(item ?? "").trim());
    })
    .filter(Boolean)
    .map(escapeCsvCell)
    .join(",");
}

export function firstId(value: unknown): string {
  if (Array.isArray(value)) {
    for (const item of value) {
      const text = String(item ?? "").trim();
      if (text) return text;
    }
    return "";
  }
  return String(value ?? "").trim();
}

export function formatEntityIds(value: unknown): string {
  const list = Array.isArray(value) ? value : value ? [value] : [];
  return list
    .map((item) => {
      if (typeof item === "object" && item !== null) {
        return firstId((item as { id?: unknown }).id);
      }
      return firstId(item);
    })
    .filter(Boolean)
    .map(escapeCsvCell)
    .join(",");
}

export function formatCourseDegrees(value: unknown): string {
  const list = Array.isArray(value) ? value : value ? [value] : [];
  return list
    .map((item) => {
      if (typeof item === "object" && item !== null) {
        return firstId((item as { degree?: unknown }).degree);
      }
      return firstId(item);
    })
    .filter(Boolean)
    .map(escapeCsvCell)
    .join(",");
}

function formatCsvValue(
  header: string,
  source: Record<string, unknown>,
): string | unknown[] {
  if (header === "publicationDate") {
    return escapeCsvCell(formatPublicationYear(source[header]));
  }
  if (header === "type") {
    return escapeCsvCell(formatPublicationType(source[header]));
  }
  if (header === "author" || header === "coadvisor") {
    return formatAuthorNames(source[header]);
  }
  if (header === "author_id") {
    return formatEntityIds(source.author);
  }
  if (header === "journal_id") {
    return formatEntityIds(source.journal);
  }
  if (header === "sponsorOrgUnit_id") {
    return formatEntityIds(source.sponsorOrgUnit);
  }
  if (header === "course_id") {
    return formatEntityIds(source.course);
  }
  if (header === "course_degree") {
    return formatCourseDegrees(source.course);
  }
  const value = source[header];
  if (Array.isArray(value)) {
    return value.map((item) => {
      if (typeof item === "object" && item !== null) {
        return entityLabel(item);
      }
      return String(item).replaceAll(";", ",");
    });
  }
  if (value == null || value === "") return "";
  return String(value).replaceAll(";", ",");
}

export function formatEntityLabels(value: unknown): string {
  const list = Array.isArray(value) ? value : value ? [value] : [];
  return list
    .map((item) => {
      if (typeof item === "object" && item !== null) {
        return entityLabel(item);
      }
      return sanitizeExportText(String(item ?? "").trim());
    })
    .filter(Boolean)
    .map(escapeCsvCell)
    .join("|");
}

export function formatScalarList(value: unknown): string {
  const list = Array.isArray(value) ? value : value ? [value] : [];
  return list
    .map((item) => sanitizeExportText(String(item ?? "").trim()))
    .filter(Boolean)
    .map(escapeCsvCell)
    .join("|");
}

export function getAuthorItems(source: Record<string, unknown>): unknown[] {
  const author = source.author;
  if (author == null) return [];
  return Array.isArray(author) ? author : [author];
}

export function jsonToCsv(jsonData: object, headers: string[]): string {
  const source = jsonData as Record<string, unknown>;
  dedupePublicationAuthors(source);
  const values = headers.map((header) => formatCsvValue(header, source));
  return values.join(csvOptions.delimiter);
}
