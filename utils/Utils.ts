import { formatAcronym } from "./ptAcronyms";
import { restorePtAccents } from "./ptAccentMap";

export const CHART_BACKGROUD_COLORS = [
  "rgba(255,0,0, 0.2)",
  "rgba(54, 162, 235, 0.2)",
  "rgba(255,215,0, 0.2)",
  "rgba(0,128,128, 0.2)",
  "rgba(153, 102, 255, 0.2)",
  "rgba(255,140,0, 0.2)",
  "rgba(201, 203, 207, 0.2)",
  "rgba(255,105,180, 0.2)",
  "rgba(139,69,19, 0.2)",
  "rgba(50,205,50, 0.2)",
];
export const CHART_BORDER_COLORS = [
  "rgba(255,0,0, 1)",
  "rgba(54, 162, 235, 1)",
  "rgba(255,215,0, 1)",
  "rgba(0,128,128, 1)",
  "rgba(153, 102, 255, 1)",
  "rgba(255,140,0, 1)",
  "rgba(201, 203, 207, 1)",
  "rgba(255,105,180, 1)",
  "rgba(139,69,19, 1)",
  "rgba(50,205,50, 1)",
];

export function containsResults(wasSearched: any, results: any) {
  return wasSearched && results.length > 0;
}

export function replaceSpacesWithHyphens(text: string) {
  return text.replace(" ", "-");
}

export function capitalizeName(name: string): string {
  const lowerWords = ["da", "de", "do", "dos", "das", "e"];

  return name
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((word, index) =>
      lowerWords.includes(word) && index !== 0
        ? word
        : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(" ");
}
export function getLattesIdentifier(lattesId?: string[]) {
  if (!Array.isArray(lattesId) || lattesId.length === 0) return null;

  const clean = lattesId.find((id) => !id.includes("::"));
  if (clean) return clean;

  return lattesId[0].split("::").pop() ?? null;
}

export function detectBioLanguage(text: string): "pt" | "en" {
  const ptHits = (
    text.match(
      /\b(de|da|do|dos|das|com|pela|pelo|foi|atuou|atualmente|possui|seus|sua|universidade)\b/gi,
    ) || []
  ).length;

  const enHits = (
    text.match(
      /\b(at|from|has|experience|focusing|acting|currently|research|and)\b/gi,
    ) || []
  ).length;

  return enHits >= ptHits ? "en" : "pt";
}

export function getBioByLanguage(
  bioArray: string[] | undefined,
  lang: "pt" | "en",
) {
  if (!Array.isArray(bioArray) || bioArray.length === 0) return "";

  if (bioArray.length === 1) return bioArray[0];

  const scored = bioArray.map((text) => ({
    text,
    lang: detectBioLanguage(text),
  }));

  const preferred = scored.find((b) => b.lang === lang);

  return preferred?.text ?? bioArray[0];
}

export function formatBooleanString(value: string | undefined, t: any) {
  if (!value) return "-";
  const boolValue = value.toLowerCase() === "true";
  return boolValue ? t("Yes") : t("No");
}

export function normalizeDoiList(
  input: string | string[] | undefined,
): string[] {
  if (!input) return [];

  const raw = Array.isArray(input) ? input.join(",") : input;

  return raw
    .replace(/^DOI/i, "")
    .split(",")
    .map((d) => d.trim())
    .filter(Boolean);
}

type TitleFormat = "html" | "text";

function decodeHtmlEntities(str: string) {
  if (!str) return "";

  return str.replace(/&#(\d+);/g, (_, dec) =>
    String.fromCharCode(parseInt(dec, 10)),
  );
}

export function _normalizeScientificTitle(
  input: string | string[] | undefined,
  format: TitleFormat = "html",
) {
  if (!input) return "";

  let t = Array.isArray(input) ? input[0] : input;
  if (typeof t !== "string") return "";

  t = decodeHtmlEntities(t);
  t = t
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");

  t = t.replace(/<\/sup>\s*o/g, "</sup>O");
  t = t.replace(/<\/sup>\s*c/g, "</sup>C");
  t = t.replace(/co<sub>2<\/sub>/gi, "CO<sub>2</sub>");
  t = t.replace(/\bamazonian\b/gi, "Amazonian");

  if (format === "text") {
    t = t
      .replace(/<[^>]+>/g, "")
      .replace(/18o\/16o/gi, "18O/16O")
      .replace(/13c\/12c/gi, "13C/12C")
      .replace(/co2/gi, "CO2")
      .replace(/\s+/g, " ")
      .trim();
  }

  return t;
}

export function getNumericLattesId(value: unknown): string {
  if (value === null || value === undefined) return "";

  if (Array.isArray(value)) {
    for (const item of value) {
      const numericId = getNumericLattesId(item);
      if (numericId) return numericId;
    }
    return "";
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;

    if (record.raw !== undefined) {
      return getNumericLattesId(record.raw);
    }

    if (record.id !== undefined) {
      return getNumericLattesId(record.id);
    }

    return "";
  }

  const text = String(value);
  const exactLattesId = text.match(/\d{16}/);
  if (exactLattesId) return exactLattesId[0];

  const numericChunk = text.match(/\d{10,}/);
  if (numericChunk) return numericChunk[0];

  const withoutPrefix = text.replace(/lattes::/gi, "").trim();
  return /^\d+$/.test(withoutPrefix) ? withoutPrefix : "";
}

const LOWER_WORDS = new Set([
  "a",
  "as",
  "o",
  "os",
  "de",
  "da",
  "do",
  "das",
  "dos",
  "e",
  "em",
  "para",
  "por",
  "com",
  "tem",
  "se",
]);

export function normalizeText(text: any): string {
  if (!text) return "";

  const safeText = String(
    Array.isArray(text)
      ? text[0]
      : typeof text === "object"
        ? text.raw || text.name || ""
        : text,
  );

  if (!safeText) return "";

  return safeText.replace(/\p{L}+/gu, (word, offset) => {
    const acronym = formatAcronym(word);
    if (acronym) return acronym;

    const restored = restorePtAccents(word.toLowerCase());

    if (offset === 0 || !LOWER_WORDS.has(restored)) {
      return restored.charAt(0).toUpperCase() + restored.slice(1);
    }

    return restored;
  });
}

export function formatPublicationYear(value: unknown): string {
  if (value === null || value === undefined) return "";

  const MIN_YEAR = 1600;
  const MAX_YEAR = 2100;
  const isValidYear = (year: number) => year >= MIN_YEAR && year <= MAX_YEAR;

  const extractYears = (token: string): number[] => {
    const clean = token.trim();
    if (!clean) return [];

    if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
      const year = Number(clean.slice(0, 4));
      return isValidYear(year) ? [year] : [];
    }

    if (/^\d{4}$/.test(clean)) {
      const year = Number(clean);
      return isValidYear(year) ? [year] : [];
    }

    if (/^\d+$/.test(clean) && clean.length >= 8 && clean.length % 4 === 0) {
      const chunks: number[] = [];
      for (let i = 0; i < clean.length; i += 4) {
        const year = Number(clean.slice(i, i + 4));
        if (isValidYear(year)) chunks.push(year);
      }
      if (chunks.length >= 2) return chunks;
    }

    return [];
  };

  const items = Array.isArray(value) ? value : [value];
  const years: number[] = [];

  for (const item of items) {
    const clean = String(item).trim();
    if (!clean) continue;

    if (clean.includes(",")) {
      for (const part of clean.split(",")) {
        years.push(...extractYears(part));
      }
      continue;
    }

    years.push(...extractYears(clean));
  }

  if (years.length > 0) {
    return String(Math.max(...years));
  }

  const fallback = String(Array.isArray(value) ? value[0] : value).trim();
  return fallback;
}

export function getPublicationTypes(type: unknown): string[] {
  if (type == null || type === "") {
    return [];
  }
  const values = Array.isArray(type) ? type : [type];
  return [
    ...new Set(values.map((item) => String(item).trim()).filter(Boolean)),
  ];
}

export function hasMultiplePublicationTypes(type: unknown): boolean {
  return getPublicationTypes(type).length > 1;
}

export function formatPublicationType(type: unknown): string {
  return getPublicationTypes(type)[0] ?? "";
}

export function formatFirstPublicationValue(value: unknown): string {
  if (value === null || value === undefined) return "";

  if (Array.isArray(value)) {
    for (const item of value) {
      const text = String(item ?? "").trim();
      if (text) return text;
    }
    return "";
  }

  const text = String(value).trim();
  if (!text) return "";

  if (text.includes(",")) {
    const first = text.split(",")[0]?.trim();
    if (first) return first;
  }

  return text;
}

export function formatDate(value: string | string[] | undefined) {
  if (!value) return "-";

  const raw = Array.isArray(value) ? value.join(",") : value;

  return raw
    .split(",")
    .map((item) => {
      const clean = item.trim();

      // formato 8 dígitos (ddMMyyyy)
      if (/^\d{8}$/.test(clean)) {
        const day = clean.slice(0, 2);
        const month = clean.slice(2, 4);
        const year = clean.slice(4, 8);
        return `${day}/${month}/${year}`;
      }

      // formato 7 dígitos (dMMyyyy ou ddMyyyy)
      if (/^\d{7}$/.test(clean)) {
        const year = clean.slice(-4);
        const rest = clean.slice(0, -4);

        let day = "";
        let month = "";

        if (rest.length === 3) {
          day = rest[0];
          month = rest.slice(1);
        } else {
          day = rest.slice(0, 2);
          month = rest.slice(2);
        }

        return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`;
      }

      // fallback ISO
      const date = new Date(clean);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString("pt-BR");
      }

      return clean;
    })
    .join(", ");
}
