import { HomeIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { useMemo } from "react";

type Breadcrumb = {
  href: string;
  label: string;
  isHome?: boolean;
};

const SINGULAR_ROUTE_KEYS: Record<string, string> = {
  courses: "Course",
  journals: "Journal",
  organizations: "Organization",
  patents: "Patent",
  people: "Person",
  programs: "Program",
  publications: "Publication",
  "research-groups": "Research Group",
  software: "Software item",
};

function pathSegmentToTranslationKey(segment: string): string {
  const words = decodeURIComponent(segment)
    .replace(/[-_]+/g, " ")
    .trim()
    .split(/\s+/);

  return words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function Breadcrumbs() {
  const router = useRouter();
  const { t } = useTranslation("common");

  const breadcrumbs = useMemo<Breadcrumb[]>(() => {
    const segments = router.pathname.split("/").filter(Boolean);

    return [
      { href: "/", label: t("Home"), isHome: true },
      ...segments.map((segment, index) => {
        const isDynamicSegment =
          segment.startsWith("[") && segment.endsWith("]");
        const previousSegment = segments[index - 1];
        const translationKey = isDynamicSegment
          ? (SINGULAR_ROUTE_KEYS[previousSegment] ?? "Item")
          : pathSegmentToTranslationKey(segment);

        return {
          href: `/${segments.slice(0, index + 1).join("/")}`,
          label: t(translationKey, { defaultValue: translationKey }),
        };
      }),
    ];
  }, [router.pathname, t]);

  return (
    <nav aria-label="breadcrumb" className="brcris-page-header__breadcrumb">
      <ol className="breadcrumb mb-0 mt-0 container pt-0">
        {breadcrumbs.map((breadcrumb, index) => {
          const isCurrentPage = index === breadcrumbs.length - 1;

          return (
            <li
              key={breadcrumb.href}
              className={`breadcrumb-item${isCurrentPage ? " active" : ""}${
                breadcrumb.isHome ? " brcris-breadcrumb__home" : ""
              }`}
              aria-current={isCurrentPage ? "page" : undefined}
            >
              {isCurrentPage ? (
                breadcrumb.isHome ? (
                  <HomeIcon aria-label={breadcrumb.label} size={16} />
                ) : (
                  breadcrumb.label
                )
              ) : (
                <Link
                  href={breadcrumb.href}
                  aria-label={breadcrumb.label}
                  title={breadcrumb.label}
                >
                  {breadcrumb.isHome ? (
                    <HomeIcon aria-hidden="true" size={16} />
                  ) : (
                    breadcrumb.label
                  )}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
