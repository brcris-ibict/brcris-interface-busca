import { LoaderCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export type BigNumberAccent = "teal" | "cyan" | "slate" | "deep";

type Props = {
  title: string;
  value: ReactNode;
  subtitle?: ReactNode;
  icon: LucideIcon;
  accent?: BigNumberAccent;
  loading?: boolean;
  error?: boolean;
  loadingLabel?: string;
  className?: string;
};

export default function BigNumber({
  title,
  value,
  subtitle,
  icon: Icon,
  accent = "teal",
  loading = false,
  error = false,
  loadingLabel,
  className = "",
}: Props) {
  return (
    <article
      className={`brcris-bignumber brcris-bignumber--${accent} ${className}`.trim()}
      aria-busy={loading}
      aria-live="polite"
    >
      <div className="brcris-bignumber__top">
        <h6 className="brcris-bignumber__title">{title}</h6>
        <span className="brcris-bignumber__icon" aria-hidden="true">
          <Icon size={18} strokeWidth={2} />
        </span>
      </div>

      <p className="brcris-bignumber__value">
        {loading ? (
          <span className="brcris-bignumber__skeleton" />
        ) : error ? (
          "—"
        ) : (
          value
        )}
      </p>

      {(subtitle || loading) && (
        <p className="brcris-bignumber__subtitle">
          {loading ? (
            <>
              <LoaderCircle className="brcris-bignumber__spinner" size={14} />
              <span>{loadingLabel ?? "…"}</span>
            </>
          ) : (
            subtitle
          )}
        </p>
      )}
    </article>
  );
}
