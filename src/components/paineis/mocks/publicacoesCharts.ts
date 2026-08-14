export const anos = ["2019", "2020", "2021", "2022", "2023", "2024"];

export const seriesAnual = [
  { name: "Artigo", data: [210, 245, 280, 320, 365, 407] },
  { name: "Trabalho em Evento", data: [88, 95, 110, 125, 140, 154] },
  { name: "Dissertação", data: [42, 48, 55, 60, 64, 68] },
  { name: "Tese", data: [22, 25, 28, 30, 31, 32] },
  { name: "Capítulo de Livro", data: [14, 16, 18, 19, 20, 20] },
  { name: "Livro", data: [9, 11, 12, 14, 15, 16] },
];

export const PAINEL_CHART_COLORS = [
  "#0284a0",
  "#0ea5b7",
  "#071d41",
  "#3a8899",
  "#f9943b",
  "#16a34a",
];

export function hexToRgba(hex: string, alpha: number) {
  const value = hex.replace("#", "");
  const n = parseInt(value, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
