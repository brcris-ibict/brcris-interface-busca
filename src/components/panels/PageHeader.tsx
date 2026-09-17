import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
};

export default function PageHeader({
  title,
  subtitle,
  actions,
}: PageHeaderProps) {
  return (
    <div className="brcris-page-header">
      <div className="brcris-page-header__row">
        <div className="brcris-page-header__copy">
          <div className="page-title mb-0">
            <h1>{title}</h1>
          </div>

          {subtitle ? (
            <p className="brcris-page-header__subtitle">{subtitle}</p>
          ) : null}
        </div>

        {actions ? (
          <div className="brcris-page-header__actions">{actions}</div>
        ) : null}
      </div>
    </div>
  );
}
