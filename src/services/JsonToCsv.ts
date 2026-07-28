// Interface para opções de conversão
export interface CsvOptions {
  headers?: boolean;
  delimiter?: string;
  eol?: string;
}

// Opções padrão
export const csvOptions: CsvOptions = {
  delimiter: ";",
  eol: "\r\n",
};

export function jsonToCsv(jsonData: object, headers: string[]): string {
  const values = headers.map((header) => {
    //@ts-expect-error
    const value = jsonData[header];
    if (Array.isArray(value)) {
      return value.map((v) => {
        if (typeof v === "object") {
          return v.name || v.title;
        }
        return v.replaceAll(";", ",");
      });
    } else {
      return value || "";
    }
  });
  return values.join(csvOptions.delimiter);
}
