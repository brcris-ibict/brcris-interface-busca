import { useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "next-i18next";
import { Download, FileSpreadsheet, Image, LoaderCircle } from "lucide-react";
import {
  downloadCsv,
  downloadDataUrl,
  type ChartExportColumn,
} from "./chartExport";

type Props = {
  filename: string;
  columns: ChartExportColumn[];
  rows: Record<string, string | number>[];
  // Se informado, o CSV busca todas as linhas (ex.: tabela server-paginated)
  onExportCsv?: () => Promise<Record<string, string | number>[]>;
  getImageDataUrl?: () => string | null | undefined;
  disabled?: boolean;
};

export default function ChartExportMenu({
  filename,
  columns,
  rows,
  onExportCsv,
  getImageDataUrl,
  disabled = false,
}: Props) {
  const { t } = useTranslation("common");
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  // Efeito para fechar o menu quando o mouse sai do elemento ou a tecla Esc é pressionada
  useEffect(() => {
    if (!open) return;

    // Função auxiliar para fechar o menu quando o mouse sai do elemento
    function onPointerDown(event: MouseEvent) {
      // Mantém o menu aberto enquanto exporta (feedback de loading)
      if (exporting) return;
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    // Função auxiliar para fechar o menu quando a tecla Esc é pressionada
    function onKeyDown(event: KeyboardEvent) {
      if (exporting) return;
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, exporting]);

  const isDisabled = disabled || exporting;
  const canExport = !isDisabled && (onExportCsv ? true : rows.length > 0);

  // Função auxiliar para baixar o CSV
  async function handleCsv() {
    if (!canExport) return;

    if (onExportCsv) {
      setExporting(true);
      try {
        const allRows = await onExportCsv();
        if (allRows.length > 0) {
          downloadCsv(filename, columns, allRows);
        }
      } finally {
        setExporting(false);
        setOpen(false);
      }
      return;
    }

    downloadCsv(filename, columns, rows);
    setOpen(false);
  }

  // Função auxiliar para baixar a imagem
  function handleImage() {
    if (!canExport || !getImageDataUrl) return;
    const dataUrl = getImageDataUrl();

    if (!dataUrl) return;

    downloadDataUrl(filename, dataUrl);
    setOpen(false);
  }

  return (
    <div className="brcris-chart-export" ref={rootRef} aria-busy={exporting}>
      <button
        type="button"
        className={open || exporting ? "is-active" : undefined}
        title={exporting ? t("Exporting spreadsheet") : t("Export")}
        aria-label={exporting ? t("Exporting spreadsheet") : t("Export")}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        disabled={isDisabled}
        onClick={() => {
          if (exporting) return;
          setOpen((current) => !current);
        }}
      >
        {exporting ? (
          <LoaderCircle className="brcris-chart-card__spinner" size={18} />
        ) : (
          <Download size={18} />
        )}
      </button>

      {open ? (
        <div
          id={menuId}
          className="brcris-chart-export__menu"
          role="menu"
          aria-label={t("Export")}
        >
          <p className="brcris-chart-export__title">{t("Export")}</p>

          <button
            type="button"
            role="menuitem"
            className="brcris-chart-export__item"
            disabled={!canExport && !exporting}
            aria-busy={exporting}
            onClick={() => {
              void handleCsv();
            }}
          >
            {exporting ? (
              <LoaderCircle className="brcris-chart-card__spinner" size={16} aria-hidden />
            ) : (
              <FileSpreadsheet size={16} aria-hidden />
            )}
            <span>
              {exporting
                ? t("Exporting spreadsheet")
                : t("Export spreadsheet")}
            </span>
          </button>

          {getImageDataUrl ? (
            <button
              type="button"
              role="menuitem"
              className="brcris-chart-export__item"
              disabled={!canExport || exporting}
              onClick={handleImage}
            >
              <Image size={16} aria-hidden />
              <span>{t("Export chart image")}</span>
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
