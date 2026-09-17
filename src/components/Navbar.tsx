import { Laptop, Moon, Sun } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { useTheme } from "../contexts/ThemeContext";
import { withBasePath } from "../lib/basePath";
import dropdownStyle from "../styles/Dropdown.module.css";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/dashboards", label: "Dashboards" },
  { href: "/team", label: "Team" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/faq", label: "Faq" },
  { href: "/data-sources", label: "Data Sources" },
];

function Navbar() {
  const LANGUAGES = process.env.LANGUAGES?.split(",");
  const router = useRouter();
  const { t } = useTranslation("navbar");

  const { asPath, pathname } = router;
  const { resolvedTheme, setThemePreference, themePreference } = useTheme();
  const ibictLogoSrc =
    resolvedTheme === "dark"
      ? withBasePath("/logos/logo-ibict-pb.png")
      : withBasePath("/logos/logo-ibict.png");

  const themeIcon =
    themePreference === "dark" ? (
      <Moon size={18} />
    ) : themePreference === "light" ? (
      <Sun size={18} />
    ) : (
      <Laptop size={18} />
    );

  const changeTo = (lang: string) => lang;
  const isNavItemActive = (href: string) =>
    href === "/"
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);

  const getNavLinkClassName = (href: string) =>
    isNavItemActive(href) ? "nav-link active" : "nav-link";

  return (
    <nav className="navbar navbar-expand-lg py-0">
      <div className="container-fluid d-flex">
        <div className="flex-nowrap d-flex align-items-end flex-justify-content-between gap-3 ms-md-5">
          <a
            className="navbar-brand"
            href="https://www.gov.br/ibict/pt-br"
            target="_blank"
            rel="noreferrer"
          >
            <picture className="navbar-logo">
              <img
                className="img-fluid ibict"
                src={ibictLogoSrc}
                alt="logo do ibict"
              />
            </picture>
          </a>
          <span className="divider"> </span>
          <Link href="/" className="navbar-brand">
            <picture className="navbar-logo">
              <img
                className="img-fluid brcris"
                src={withBasePath("/logos/logo-brcris.png")}
                alt="logo do brcris"
              />
            </picture>
          </Link>

          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
        </div>
        <div className="collapse navbar-collapse ms-md-4" id="navbarNav">
          <div className="navbar-nav me-auto mb-2 mb-lg-0"></div>

          <ul className="navbar-nav nav nav-tabs">
            {NAV_ITEMS.map(({ href, label }) => {
              const isActive = isNavItemActive(href);

              return (
                <li className="nav-item me-2" role="presentation" key={href}>
                  <Link
                    href={href}
                    className={getNavLinkClassName(href)}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {t(label)}
                  </Link>
                </li>
              );
            })}
            <li className="nav-item me-2" role="presentation">
              <div className={dropdownStyle.dropdown}>
                <div className={dropdownStyle.flexCenter}>
                  <a href="#" className="nav-link d-flex align-items-center">
                    {t(router.locale || "en")}
                    <svg
                      height="20"
                      width="20"
                      viewBox="0 0 20 20"
                      aria-hidden="true"
                      focusable="false"
                      className="css-tj5bde-Svg"
                    >
                      <path
                        fill="currentColor"
                        d="M4.516 7.548c0.436-0.446 1.043-0.481 1.576 0l3.908 3.747 3.908-3.747c0.533-0.481 1.141-0.446 1.574 0 0.436 0.445 0.408 1.197 0 1.615-0.406 0.418-4.695 4.502-4.695 4.502-0.217 0.223-0.502 0.335-0.787 0.335s-0.57-0.112-0.789-0.335c0 0-4.287-4.084-4.695-4.502s-0.436-1.17 0-1.615z"
                      ></path>
                    </svg>
                  </a>
                </div>
                <div className={dropdownStyle.dropdownContent}>
                  {LANGUAGES?.map((lang) => (
                    <Link
                      href={asPath}
                      locale={changeTo(lang)}
                      key={lang}
                      className={
                        router.locale === lang
                          ? `${dropdownStyle.languageLink} ${dropdownStyle.activeItem}`
                          : dropdownStyle.languageLink
                      }
                    >
                      {t(lang)}
                    </Link>
                  ))}
                </div>
              </div>
            </li>
            <li className="nav-item me-2" role="presentation">
              <div className={dropdownStyle.dropdown}>
                <div className={dropdownStyle.flexCenter}>
                  <button
                    type="button"
                    className="nav-link theme-toggle-button"
                    aria-label={t(`Theme mode: ${themePreference}`)}
                    title={t("Theme mode")}
                  >
                    {themeIcon}
                    <span>{t("Theme")}</span>
                    <span className="theme-toggle-value">
                      {t(
                        themePreference === "system"
                          ? "System"
                          : themePreference === "dark"
                            ? "Dark"
                            : "Light",
                      )}
                    </span>
                    <svg
                      height="20"
                      width="20"
                      viewBox="0 0 20 20"
                      aria-hidden="true"
                      focusable="false"
                      className="css-tj5bde-Svg"
                    >
                      <path
                        fill="currentColor"
                        d="M4.516 7.548c0.436-0.446 1.043-0.481 1.576 0l3.908 3.747 3.908-3.747c0.533-0.481 1.141-0.446 1.574 0 0.436 0.445 0.408 1.197 0 1.615-0.406 0.418-4.695 4.502-4.695 4.502-0.217 0.223-0.502 0.335-0.787 0.335s-0.57-0.112-0.789-0.335c0 0-4.287-4.084-4.695-4.502s-0.436-1.17 0-1.615z"
                      ></path>
                    </svg>
                  </button>
                </div>
                <div className={dropdownStyle.dropdownContent}>
                  <button
                    type="button"
                    className={`d-flex align-items-center ${dropdownStyle.dropdownAction} ${themePreference === "system" ? dropdownStyle.activeItem : ""}`.trim()}
                    onClick={() => setThemePreference("system")}
                  >
                    <Laptop size={18} /> {t("System")}
                  </button>
                  <button
                    type="button"
                    className={`d-flex align-items-center ${dropdownStyle.dropdownAction} ${themePreference === "light" ? dropdownStyle.activeItem : ""}`.trim()}
                    onClick={() => setThemePreference("light")}
                  >
                    <Sun size={18} /> {t("Light")}
                  </button>
                  <button
                    type="button"
                    className={`d-flex align-items-center ${dropdownStyle.dropdownAction} ${themePreference === "dark" ? dropdownStyle.activeItem : ""}`.trim()}
                    onClick={() => setThemePreference("dark")}
                  >
                    <Moon size={18} /> {t("Dark")}
                  </button>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
