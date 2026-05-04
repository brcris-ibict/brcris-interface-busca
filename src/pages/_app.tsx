import "bootstrap/dist/css/bootstrap.min.css"; // Import bootstrap CSS
import "bootstrap-icons/font/bootstrap-icons.css";

import type { AppProps } from "next/app";
import Head from "next/head";
import { appWithTranslation } from "next-i18next";
import { useEffect } from "react";
import Analytics from "../components/analytics";
import Layout from "../components/layouts/Layout";
import { THEME_STORAGE_KEY, ThemeProvider } from "../contexts/ThemeContext";
import "../styles/globals.scss";

import { Roboto } from "next/font/google";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["100", "300", "400", "500", "700", "900"],
  style: ["normal", "italic"],
});

const themeInitScript = `(function () {
  try {
    var storedTheme = window.localStorage.getItem("${THEME_STORAGE_KEY}") || "system";
    var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    var resolvedTheme = storedTheme === "system"
      ? (prefersDark ? "dark" : "light")
      : (storedTheme === "dark" ? "dark" : "light");
    document.documentElement.dataset.theme = resolvedTheme;
    document.documentElement.style.colorScheme = resolvedTheme;
  } catch (error) {
    document.documentElement.dataset.theme = "light";
    document.documentElement.style.colorScheme = "light";
  }
})();`;

function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("bootstrap/dist/js/bootstrap.bundle.min.js");
  }, []);
  return (
    <>
      <Head>
        <script
          id="theme-init"
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
        />
      </Head>
      {/* <Barra /> */}
      <ThemeProvider>
        <Analytics />
        <Layout fontFamily={roboto.className}>
          <Component {...pageProps} />
        </Layout>
      </ThemeProvider>
    </>
  );
}

export default appWithTranslation(MyApp);
