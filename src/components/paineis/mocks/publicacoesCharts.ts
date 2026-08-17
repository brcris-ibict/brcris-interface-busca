export const anos = ["2018", "2019", "2020", "2021", "2022", "2023", "2024"];

export const seriesAnual = [
  { name: "Artigo", data: [136, 215, 275, 367, 769, 836, 407] },
  { name: "Trabalho em Evento", data: [52, 70, 80, 104, 250, 268, 154] },
  { name: "Dissertação", data: [14, 40, 54, 59, 125, 129, 68] },
  { name: "Tese", data: [12, 23, 19, 25, 82, 81, 32] },
  { name: "Capítulo de Livro", data: [11, 9, 11, 15, 39, 51, 20] },
  { name: "Livro", data: [5, 7, 10, 11, 34, 15, 16] },
];

export const PRIMARY_CHART_COLOR = "#0284a0";

export const seriesAnualTotal = {
  name: "Publicações",
  data: [230, 364, 449, 581, 1299, 1380, 697],
};

export const seriesPorTipo = [
  { name: "Artigo", value: 3005 },
  { name: "Trabalho em Evento", value: 978 },
  { name: "Dissertação", value: 489 },
  { name: "Tese", value: 274 },
  { name: "Capítulo de Livro", value: 156 },
  { name: "Livro", value: 98 },
];

export const PAINEL_CHART_COLORS = [
  "#67c5d8",
  "#6c757d",
  "#0ea5b7",
  "#bbbbbb",
  "#0284a0",
  "#04132a",
];

export function hexToRgba(hex: string, alpha: number) {
  const value = hex.replace("#", "");
  const n = parseInt(value, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
