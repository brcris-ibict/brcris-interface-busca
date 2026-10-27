import Head from "next/head";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { type PropsWithChildren, useEffect } from "react";
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

  useEffect(() => {
    let mainFocusedFromSkipLink = false;

    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.key !== "Tab" ||
        event.shiftKey ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey
      ) {
        return;
      }

      const skip = document.querySelector<HTMLAnchorElement>(".skip-link");
      if (!skip || document.activeElement === skip) return;

      const main = document.getElementById("main-content");
      const active = document.activeElement;
      const atPageStart =
        !active ||
        active === document.body ||
        active === document.documentElement ||
        active === main;

      if (!atPageStart) return;

      if (active === main && mainFocusedFromSkipLink) {
        mainFocusedFromSkipLink = false;
        return;
      }

      event.preventDefault();
      skip.focus({ focusVisible: true } as FocusOptions);
    };

    const onSkipActivate = (event: Event) => {
      const main = document.getElementById("main-content");
      if (!main) return;

      event.preventDefault();
      mainFocusedFromSkipLink = true;
      document
        .querySelectorAll(".skip-target")
        .forEach((element) => element.classList.remove("skip-target"));

      main.focus({ preventScroll: true, focusVisible: true } as FocusOptions);

      const heading = main.querySelector("h1, h2");
      const target = heading instanceof HTMLElement ? heading : main;
      target.classList.add("skip-target");
      target.scrollIntoView({ block: "start" });

      main.addEventListener(
        "blur",
        () => target.classList.remove("skip-target"),
        { once: true },
      );
    };

    const skip = document.querySelector(".skip-link");
    skip?.addEventListener("click", onSkipActivate);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      skip?.removeEventListener("click", onSkipActivate);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

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
