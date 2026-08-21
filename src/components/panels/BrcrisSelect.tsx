import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { useTranslation } from "next-i18next";
import { Check, ChevronDown, Search } from "lucide-react";

export type BrcrisSelectOption = {
  value: string;
  label: string;
};

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

type Props = {
  id: string;
  label: string;
  value: string;
  options: BrcrisSelectOption[];
  onChange: (value: string) => void;
};

export default function BrcrisSelect({
  id,
  label,
  value,
  options,
  onChange,
}: Props) {
  const { t } = useTranslation("common");
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const selected = options.find((opt) => opt.value === value);
  const selectedLabel = selected?.label ?? "";

  const filtered = useMemo(() => {
    const term = normalizeSearch(query.trim());
    if (!term) return options;

    return options.filter((opt) =>
      normalizeSearch(opt.label).includes(term),
    );
  }, [options, query]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);

    return () => document.removeEventListener("mousedown", onPointerDown);

  }, [open]);

  useEffect(() => {
    if (!open) return;

    setQuery("");
    setActiveIndex(0);
    requestAnimationFrame(() => searchRef.current?.focus());

  }, [open]);

  const selectOption = (nextValue: string) => {
    onChange(nextValue);
    setOpen(false);

  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!open) {
      if (
        event.key === "ArrowDown" ||
        event.key === "Enter" ||
        event.key === " "
      ) {
        event.preventDefault();
        setOpen(true);
      }
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();

      setActiveIndex((prev) =>
        filtered.length ? (prev + 1) % filtered.length : 0,
      );

      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();

      setActiveIndex((prev) =>
        filtered.length ? (prev - 1 + filtered.length) % filtered.length : 0,
      );

      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const option = filtered[activeIndex];

      if (option) selectOption(option.value);
      
    }
  };

  return (
    <div
      className={`brcris-field brcris-select ${open ? "is-open" : ""}`}
      ref={rootRef}
      onKeyDown={handleKeyDown}
    >
      <button
        id={id}
        type="button"
        className="brcris-field__control"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-listbox`}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="brcris-select__value">{selectedLabel}</span>
        <ChevronDown size={16} className="brcris-select__chevron" />
      </button>

      <label className="brcris-field__label" htmlFor={id}>
        {label}
      </label>

      {open ? (
        <div className="brcris-select__menu" id={`${id}-listbox`} role="listbox">
          <div className="brcris-select__search">
            <Search size={14} />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIndex(0);
              }}
              placeholder={t("Search")}
              aria-label={t("Search")}
            />
          </div>

          <div className="brcris-select__options">
            {filtered.length === 0 ? (
              <div className="brcris-select__empty">{t("No options found")}</div>
            ) : (
              filtered.map((option, index) => {
                const isSelected = option.value === value;
                const isActive = index === activeIndex;

                return (
                  <button
                    key={`${option.value}-${option.label}`}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    className={`brcris-select__option${isSelected ? " is-selected" : ""}${isActive ? " is-active" : ""}`}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => selectOption(option.value)}
                  >
                    <span>{option.label}</span>
                    {isSelected ? <Check size={14} /> : null}
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
