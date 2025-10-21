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
