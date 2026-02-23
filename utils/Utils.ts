6;
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
