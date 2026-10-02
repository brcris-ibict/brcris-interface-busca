import Head from "next/head";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import type { PropsWithChildren } from "react";
import CookieConsent from "../banners/CookieConsent";
import Footer from "../Footer";
import Navbar from "../Navbar";
import Breadcrumbs from "./Breadcrumbs";

interface LayoutProps extends PropsWithChildren {}

export default function Layout({ children }: LayoutProps) {
  const BRCRIS_HOST_BASE =
    process.env.BRCRIS_HOST_BASE || "https://brcris.ibict.br";
  const router = useRouter();
  const { t } = useTranslation("navbar");
  const locales = router.locales;
  const defaultLocale = router.defaultLocale;
  const currentPath = router.asPath;
  const isHomePage = router.pathname === "/";

  return (
    <>
      <Head>
        {locales?.map((lang) => (
          <link
            key={lang}
            rel="alternate"
            hrefLang={lang}
            href={`${BRCRIS_HOST_BASE}${lang !== defaultLocale ? "/" + lang : ""}${currentPath}`}
          />
        ))}
      </Head>
      <a className="skip-link" href="#main-content">
        {t("Skip to main content")}
      </a>
      <Navbar />
      {/* <Alert /> */}

      <main
        id="main-content"
        tabIndex={-1}
        style={{ paddingTop: "100px" }}
        className={`container-fluid`}
      >
        {!isHomePage ? <Breadcrumbs /> : null}
        {children}
      </main>
      <CookieConsent />
      <Footer />
    </>
  );
}
