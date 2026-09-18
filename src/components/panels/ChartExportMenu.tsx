import { useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "next-i18next";
import { Download, FileSpreadsheet, Image } from "lucide-react";
import {
  downloadCsv,
  downloadDataUrl,
  type ChartExportColumn,
} from "./chartExport";

type Props = {
  filename: string;
  columns: ChartExportColumn[];
  rows: Record<string, string | number>[];
  getImageDataUrl?: () => string | null | undefined;
  disabled?: boolean;
};

export default function ChartExportMenu({
  filename,
  columns,
  rows,
  getImageDataUrl,
  disabled = false,
}: Props) {
  const { t } = useTranslation("common");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  // Efeito para fechar o menu quando o mouse sai do elemento ou a tecla Esc é pressionada
  useEffect(() => {
    if (!open) return;

    // Função auxiliar para fechar o menu quando o mouse sai do elemento
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    // Função auxiliar para fechar o menu quando a tecla Esc é pressionada
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };

  }, [open]);

  const canExport = !disabled && rows.length > 0;

  // Função auxiliar para baixar o CSV
  function handleCsv() {
    if (!canExport) return;

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
    <div className="brcris-chart-export" ref={rootRef}>
      <button
        type="button"
        className={open ? "is-active" : undefined}
        title={t("Export")}
        aria-label={t("Export")}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
      >
        <Download size={18} />
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
            disabled={!canExport}
            onClick={handleCsv}
          >
            <FileSpreadsheet size={16} aria-hidden />
            <span>{t("Export spreadsheet")}</span>
          </button>

          {getImageDataUrl ? (
            <button
              type="button"
              role="menuitem"
              className="brcris-chart-export__item"
              disabled={!canExport}
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
