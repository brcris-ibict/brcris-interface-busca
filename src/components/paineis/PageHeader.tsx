import Link from "next/link";

export type Crumb = {
  label: string;
  href?: string;
};

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  breadcrumbs: Crumb[];
};

export default function PageHeader({
  title,
  subtitle,
  breadcrumbs,
}: PageHeaderProps) {
  return (
    <div className="brcris-page-header">
      <nav aria-label="breadcrumb" className="brcris-page-header__breadcrumb">
        <ol className="breadcrumb mb-0">
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;

            return (
              <li
                key={`${crumb.label}-${index}`}
                className={
                  isLast || !crumb.href
                    ? "breadcrumb-item active"
                    : "breadcrumb-item"
                }
                aria-current={isLast ? "page" : undefined}
              >
                {crumb.href && !isLast ? (
                  <Link href={crumb.href}>{crumb.label}</Link>
                ) : (
                  crumb.label
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="page-title mb-0">
        <h1>{title}</h1>
      </div>

      {subtitle ? (
        <p className="brcris-page-header__subtitle">{subtitle}</p>
      ) : null}
    </div>
  );
}
