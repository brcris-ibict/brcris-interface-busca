import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { useTranslation } from "next-i18next";
import { Search, X } from "lucide-react";
import { SEARCH_MAX_LENGTH, SEARCH_MIN_LENGTH } from "../../lib/textSearch";

type Props = {
  value: string; // Termo aplicado
  onSearch: (term: string) => void; // Aplica ("" limpa)
  placeholder?: string;
};

// Busca das tabelas: lupa que abre um popover (mesmo padrão do menu de exportar)
export default function PanelTableSearch({ value, onSearch, placeholder }: Props) {
  const { t } = useTranslation("common");
  const inputId = useId();
  const hintId = useId();
  const popoverId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);

  // Sincroniza o texto quando a busca é limpa por fora (ex.: chip)
  useEffect(() => {
    setDraft(value);
  }, [value]);

  // Ao abrir, foca e seleciona o termo atual (facilita trocar a busca)
  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.select());
  }, [open]);

  // Fecha ao clicar fora, descartando o texto não aplicado
  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setDraft(value);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open, value]);

  const trimmed = draft.trim();
  const tooShort = trimmed.length > 0 && trimmed.length < SEARCH_MIN_LENGTH;
  const canSubmit = trimmed.length >= SEARCH_MIN_LENGTH;

  function close() {
    setOpen(false);
    setDraft(value);
    requestAnimationFrame(() => toggleRef.current?.focus());
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    onSearch(trimmed);
    setOpen(false);
    requestAnimationFrame(() => toggleRef.current?.focus());
  }

  function handleClear() {
    setDraft("");
    if (value) onSearch("");
    inputRef.current?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Escape") return;
    event.preventDefault();

    // 1º Esc descarta o texto não aplicado; 2º fecha
    if (draft !== value) {
      setDraft(value);
      return;
    }
    close();
  }

  return (
    <div className="brcris-chart-export brcris-table-search" ref={rootRef}>
      <button
        ref={toggleRef}
        type="button"
        className={`brcris-table-search__toggle${open ? " is-active" : ""}${value ? " has-value" : ""}`}
        aria-label={t("Search in table")}
        title={t("Search in table")}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={popoverId}
        onClick={() => (open ? close() : setOpen(true))}
      >
        <Search size={16} aria-hidden />
      </button>

      {open ? (
        <form
          id={popoverId}
          role="search"
          className="brcris-table-search__popover"
          onSubmit={handleSubmit}
        >
          <label htmlFor={inputId} className="brcris-chart-export__title">
            {t("Search in table")}
          </label>

          <div className="brcris-table-search__field">
            <Search size={15} className="brcris-table-search__icon" aria-hidden />
            <input
              id={inputId}
              ref={inputRef}
              type="text"
              className="brcris-table-search__input"
              value={draft}
              maxLength={SEARCH_MAX_LENGTH}
              placeholder={placeholder ?? t("Search in table")}
              autoComplete="off"
              aria-describedby={hintId}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKeyDown}
            />
            {draft ? (
              <button
                type="button"
                className="brcris-table-search__clear"
                aria-label={t("Clear search")}
                title={t("Clear search")}
                onClick={handleClear}
              >
                <X size={14} aria-hidden />
              </button>
            ) : null}
          </div>

          <div className="brcris-table-search__footer">
            <span id={hintId} className="brcris-table-search__hint" aria-live="polite">
              {tooShort
                ? t("Search min length", { minLabel: String(SEARCH_MIN_LENGTH) })
                : ""}
            </span>
            <button
              type="submit"
              className="brcris-table-search__submit"
              disabled={!canSubmit}
            >
              {t("Run search")}
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
