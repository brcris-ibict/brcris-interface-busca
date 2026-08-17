export const PRIMARY_CHART_COLOR = "#0284a0";

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
  const color = parseInt(value, 16);
  const red = (color >> 16) & 255;
  const green = (color >> 8) & 255;
  const blue = color & 255;

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}
