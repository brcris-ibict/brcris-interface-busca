/**
 * Configurações de cores e estilos para os gráficos dos painéis
 * Paleta oficial brCris: #0284A0, #071D41, #FFD6E7, #D9D2FF, #CFE7FF
 */

export const BRCRIS_PALETTE = {
  primary: "#0284A0",
  darkBlue: "#071D41",
  pink: "#FFD6E7",
  lavender: "#D9D2FF",
  softBlue: "#CFE7FF",
} as const;

export const PRIMARY_CHART_COLOR = BRCRIS_PALETTE.primary;

// Função utilitária para transformar uma cor hex em rgba, útil para brincar com transparência nos gráficos
export function hexToRgba(hex: string, alpha: number) {
  const value = hex.replace("#", "");
  const color = parseInt(value, 16);
  const red = (color >> 16) & 255;
  const green = (color >> 8) & 255;
  const blue = color & 255;
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

// Cores de bordas/séries para gráficos categóricos (nacionalidade, instituição, idioma)
export const PANEL_CHART_BORDERS = [
  BRCRIS_PALETTE.primary, // #0284A0
  BRCRIS_PALETTE.darkBlue, // #071D41
  "#8E7DFF", // Variante de borda do lavender #D9D2FF
  "#E07A9F", // Variante de borda do pink #FFD6E7
  "#4A90E2", // Variante de borda do softBlue #CFE7FF
  "#0ea5b7",
  "#6c757d",
  "#bbbbbb",
];

// É assim que controlamos a opacidade dos fills no modo dark
const PANEL_CHART_FILL_ALPHA = 0.28;

// Aqui a gente gera as cores de fundo (usando o alpha de cima) a partir das bordas
export const PANEL_CHART_FILLS = PANEL_CHART_BORDERS.map((color) =>
  hexToRgba(color, PANEL_CHART_FILL_ALPHA),
);

// Por compatibilidade: ainda tem gráfico que lê essa constante antiga
export const PANEL_CHART_COLORS = PANEL_CHART_FILLS;

// Cores dos tipos de publicação alinhadas com a paleta brCris e com PersonProduction.tsx
export const PUBLICATION_TYPE_COLORS: Record<string, string> = {
  Artigo: BRCRIS_PALETTE.lavender, // #D9D2FF
  "Artigo de Conferência": BRCRIS_PALETTE.pink, // #FFD6E7
  "Capítulo de Livro": BRCRIS_PALETTE.softBlue, // #CFE7FF
  Livro: "#D7F5E3",
  Dissertação: "#FFF0C2",
  Tese: "#FFE3C8",
  "Conjunto de Dados": "#CFF5F6",
  Preprint: "#E3E7F0",
};

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

// Alpha fixo para preenchimento dos tipos de publicação no modo dark
const PUBLICATION_TYPE_FILL_ALPHA = 0.28;

export type ChartColorMode = "light" | "dark";

// Light: sólido (padrão Tipologia). Dark: fill suave com transparência.
export function chartFillColor(hex: string, mode: ChartColorMode = "light") {
  if (mode === "dark") {
    return hexToRgba(hex, PANEL_CHART_FILL_ALPHA);
  }
  return hex;
}

// Dá pra usar essa função pra pegar o estilo certo de cada tipo de publicação
export function getPublicationTypeStyle(
  type: string,
  mode: ChartColorMode = "light",
) {
  const borderColor = PUBLICATION_TYPE_BORDERS[type] ?? "#999999";
  const lightColor = PUBLICATION_TYPE_COLORS[type] ?? borderColor;
  return {
    color: mode === "dark" ? hexToRgba(borderColor, PUBLICATION_TYPE_FILL_ALPHA) : lightColor,
    borderColor,
  };
}

// Mesma ideia, mas agora para gráficos que só têm "índice" (idioma/instituição/etc.)
export function getPanelSeriesStyle(
  index: number,
  mode: ChartColorMode = "light",
) {
  const i = index % PANEL_CHART_BORDERS.length;
  const borderColor = PANEL_CHART_BORDERS[i];
  return {
    color: chartFillColor(borderColor, mode),
    borderColor,
  };
}

// Escala sequencial calibrada entre o azul escuro brCris (#071D41) e o tom primário (#0284A0)
const SEQUENTIAL_SCALE: Record<ChartColorMode, { from: string; to: string; text: string; separator: string }> = {
  light: { from: BRCRIS_PALETTE.darkBlue, to: BRCRIS_PALETTE.primary, text: "#ffffff", separator: "#fefefe" },
  dark: { from: "#d4f1f7", to: "#1497b1", text: "#111827", separator: "#171b22" },
};

function mixHex(from: string, to: string, amount: number) {
  const start = parseInt(from.replace("#", ""), 16);
  const end = parseInt(to.replace("#", ""), 16);
  const channel = (shift: number) => {
    const a = (start >> shift) & 255;
    const b = (end >> shift) & 255;
    return Math.round(a + (b - a) * amount)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${channel(16)}${channel(8)}${channel(0)}`;
}

// Primeira fatia (maior valor/primeira faixa) = tom mais intenso
export function getSequentialSliceStyle(
  index: number,
  total: number,
  mode: ChartColorMode = "light",
) {
  const scale = SEQUENTIAL_SCALE[mode];
  const amount = total > 1 ? Math.min(index, total - 1) / (total - 1) : 0;
  return {
    color: mixHex(scale.from, scale.to, amount),
    borderColor: scale.separator,
    borderWidth: 2,
  };
}

export function sequentialLabelColor(mode: ChartColorMode = "light") {
  return SEQUENTIAL_SCALE[mode].text;
}

// "Sem idioma"/"Sem instituição": cinza neutro fora da escala, com ≥ 3:1 no fundo
export const MISSING_SLICE_COLOR: Record<ChartColorMode, string> = {
  light: "#6b7280",
  dark: "#9ca3af",
};
