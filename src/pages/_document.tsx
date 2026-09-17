import { Head, Html, Main, NextScript } from "next/document";
import Script from "next/script";
import { THEME_INIT_SCRIPT } from "../lib/theme";

export default function Document() {
  return (
    <Html>
      <Head>
        <Script id="theme-init" strategy="beforeInteractive">
          {THEME_INIT_SCRIPT}
        </Script>
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
