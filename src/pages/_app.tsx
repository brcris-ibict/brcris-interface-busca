import "bootstrap/dist/css/bootstrap.min.css"; // Import bootstrap CSS
import "bootstrap-icons/font/bootstrap-icons.css";

import type { AppProps } from "next/app";
import Head from "next/head";
import { appWithTranslation } from "next-i18next";
import { useEffect } from "react";
import Analytics from "../components/analytics";
import Layout from "../components/layouts/Layout";
import { ThemeProvider } from "../contexts/ThemeContext";
import "../styles/globals.scss";

function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("bootstrap/dist/js/bootstrap.bundle.min.js");
  }, []);
  return (
    <>
      <Head>
        <meta
          name="google-site-verification"
          content="O4MlrfmxB744id4GdcKmv79sPQNLIjWzEB_VV9o1byw"
        />
      </Head>
      {/* <Barra /> */}
      <ThemeProvider>
        <Analytics />
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </ThemeProvider>
    </>
  );
}

export default appWithTranslation(MyApp);
