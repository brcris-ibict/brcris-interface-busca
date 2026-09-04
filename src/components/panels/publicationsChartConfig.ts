/**
 * Configurações de cores e estilos para os gráficos dos painéis
 *
 * Este arquivo contém funções e constantes para controlar cores e estilos dos gráficos dos painéis.
 *
 * As cores são usadas para definir as bordas e preenchimentos dos gráficos, e as funções
 * permitem personalizar esses estilos para diferentes tipos de dados.
 *
 * As constantes são usadas para definir as cores das bordas e preenchimentos dos gráficos,
 * e as funções são usadas para gerar as cores de fundo a partir das bordas.
 */

export const PRIMARY_CHART_COLOR = "#0284a0";

// Função utilitária para transformar uma cor hex em rgba, útil para brincar com transparência nos gráficos
export function hexToRgba(hex: string, alpha: number) {
  const value = hex.replace("#", "");
  const color = parseInt(value, 16);
  const red = (color >> 16) & 255;
  const green = (color >> 8) & 255;
  const blue = color & 255;
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

// Essas são as cores das bordas usadas nos gráficos dos painéis (por exemplo, idioma, instituição, etc.)
// A ordem e as repetições ajudam na variedade visual dos gráficos que podem ter mais fatias/barras do que cores únicas
export const PANEL_CHART_BORDERS = [
  "#67c5d8",
  "#6c757d",
  "#0ea5b7",
  "#bbbbbb",
  "#0284a0",
  "#04132a",
  "#67c5d8",
  "#6c757d",
  "#0ea5b7",
  "#bbbbbb",
];

// É assim que controlamos a opacidade dos fills nos gráficos dos painéis
const PANEL_CHART_FILL_ALPHA = 0.28;

// Aqui a gente gera as cores de fundo (usando o alpha de cima) a partir das bordas
export const PANEL_CHART_FILLS = PANEL_CHART_BORDERS.map((color) =>
  hexToRgba(color, PANEL_CHART_FILL_ALPHA),
);

// Por compatibilidade: ainda tem gráfico que lê essa constante antiga
export const PANEL_CHART_COLORS = PANEL_CHART_FILLS;

// As cores das bordas dos tipos de publicação, pra ficarem iguais à página de pessoas
export const PUBLICATION_TYPE_BORDERS: Record<string, string> = {
  Artigo: "#B8A9FF",
  "Artigo de Conferência": "#FF9FC5",
  "Capítulo de Livro": "#9FD0FF",
  Livro: "#9FE3C5",
  Dissertação: "#FFD976",
  Tese: "#FFC49C",
  "Conjunto de Dados": "#8EE3E6",
  Preprint: "#B5C0D6",
};

// Alpha fixo para preenchimento dos tipos de publicação mantemos os fills suaves
const PUBLICATION_TYPE_FILL_ALPHA = 0.28;

// Dá pra usar essa função pra pegar o estilo certo de cada tipo de publicação (cor de preenchimento e borda)
export function getPublicationTypeStyle(type: string) {
  const borderColor = PUBLICATION_TYPE_BORDERS[type] ?? "#999999";
  return {
    color: hexToRgba(borderColor, PUBLICATION_TYPE_FILL_ALPHA),
    borderColor,
  };
}

// Mesma ideia, mas agora para gráficos que só têm "índice" (tipo idioma/instituição/etc.)
export function getPanelSeriesStyle(index: number) {
  const i = index % PANEL_CHART_BORDERS.length;
  return {
    color: hexToRgba(PANEL_CHART_BORDERS[i], PANEL_CHART_FILL_ALPHA),
    borderColor: PANEL_CHART_BORDERS[i],
  };
}
