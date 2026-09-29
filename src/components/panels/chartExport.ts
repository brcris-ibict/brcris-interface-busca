export type ChartExportColumn = {
  key: string;
  header: string;
};

// Função auxiliar para escapar células do CSV
function escapeCsvCell(value: string | number) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

// Função auxiliar para baixar o CSV
export function downloadCsv(
  filename: string,
  columns: ChartExportColumn[],
  rows: Record<string, string | number>[],
) {
  const header = columns.map((column) => escapeCsvCell(column.header)).join(",");
  const body = rows
    .map((row) =>
      columns.map((column) => escapeCsvCell(row[column.key] ?? "")).join(","),
    )
    .join("\n");

  const csv = `\uFEFF${header}\n${body}`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function downloadDataUrl(filename: string, dataUrl: string) {
  const anchor = document.createElement("a");
  anchor.href = dataUrl;
  anchor.download = filename.endsWith(".png") ? filename : `${filename}.png`;
  anchor.click();
}

const PNG_PIXEL_RATIO = 2;

// Com renderer SVG, getDataURL sempre devolve SVG; o PNG sai de uma cópia em canvas fora da tela
export async function renderChartPng(
  chart: import("echarts").ECharts,
  backgroundColor = "#ffffff",
  title?: string,
) {
  const echarts = await import("echarts");
  const container = document.createElement("div");
  container.style.cssText = `position:fixed;left:-10000px;top:0;width:${chart.getWidth()}px;height:${chart.getHeight()}px;`;
  document.body.appendChild(container);

  const copy = echarts.init(container, undefined, { renderer: "canvas" });
  let chartUrl: string;

  try {
    copy.setOption(
      {
        ...(chart.getOption() as Record<string, unknown>),
        animation: false,
      },
      true,
    );

    chartUrl = copy.getDataURL({
      type: "png",
      pixelRatio: PNG_PIXEL_RATIO,
      backgroundColor,
    });
  } finally {
    copy.dispose();
    container.remove();
  }

  return title ? addTitleToPng(chartUrl, title, backgroundColor) : chartUrl;
}

function isDarkColor(hex: string) {
  const value = hex.replace("#", "");
  if (value.length !== 6) return false;
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b < 128;
}

// Desenha o título numa faixa acima do gráfico, sem alterar o layout do ECharts
async function addTitleToPng(
  dataUrl: string,
  title: string,
  backgroundColor: string,
) {
  const image = new Image();
  image.src = dataUrl;
  await image.decode();

  const padding = 16 * PNG_PIXEL_RATIO;
  const fontSize = 18 * PNG_PIXEL_RATIO;
  const headerHeight = fontSize + padding * 2;

  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height + headerHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;

  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const fontFamily = getComputedStyle(document.body).fontFamily || "sans-serif";
  ctx.font = `600 ${fontSize}px ${fontFamily}`;
  ctx.fillStyle = isDarkColor(backgroundColor) ? "#f3f4f6" : "#1f2937";
  ctx.textBaseline = "middle";
  ctx.fillText(title, padding, headerHeight / 2, canvas.width - padding * 2);

  ctx.drawImage(image, 0, headerHeight);

  return canvas.toDataURL("image/png");
}
