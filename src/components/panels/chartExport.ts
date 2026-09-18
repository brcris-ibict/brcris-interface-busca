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
