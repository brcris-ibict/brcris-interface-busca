/* eslint-disable @typescript-eslint/ban-ts-comment */
import type { GetStaticProps } from "next";
import Head from "next/head";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Architecture from "../components/about/Architecture";
import DataSources from "../components/about/DataSources";
import History from "../components/about/History";
import Privacy from "../components/about/Privacy";
import Publications from "../components/about/Publications";
import TermsOfUse from "../components/about/TermsOfUse";

type Props = {};
export const getStaticProps: GetStaticProps<Props> = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? "en", [
      "about",
      "navbar",
      "common",
    ])),
  },
});

export default function About() {
  const { t } = useTranslation(["about", "common"]);
  return (
    <>
      <Head>
        <title>{`BrCris - ${t("About")}`}</title>
      </Head>
      <div className="App">
        <div className="container page about tablist d-flex align-content-center flex-column">
          <div className="page-title">
            <h1>{t("About")}</h1>
          </div>
          <ul className="nav nav-tabs d-flex justify-content-center" id="myTab">
            <li className="nav-item" role="presentation">
              <button
                className="nav-link active"
                id="terms-tab"
                data-bs-toggle="tab"
                data-bs-target="#terms"
                type="button"
                role="tab"
                aria-controls="terms"
                aria-selected="true"
              >
                {t("Terms of use")}
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className="nav-link"
                id="privacy-tab"
                data-bs-toggle="tab"
                data-bs-target="#privacy"
                type="button"
                role="tab"
                aria-controls="privacy"
                aria-selected="false"
              >
                {t("Privacy policy")}
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className="nav-link"
                id="sources-tab"
                data-bs-toggle="tab"
                data-bs-target="#sources"
                type="button"
                role="tab"
                aria-controls="sources"
                aria-selected="false"
              >
                {t("Data sources")}
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className="nav-link"
                id="publications-tab"
                data-bs-toggle="tab"
                data-bs-target="#publications"
                type="button"
                role="tab"
                aria-controls="publications"
                aria-selected="false"
              >
                {t("Publications")}
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className="nav-link"
                id="architecture-tab"
                data-bs-toggle="tab"
                data-bs-target="#architecture"
                type="button"
                role="tab"
                aria-controls="architecture"
                aria-selected="false"
              >
                {t("System architecture")}
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className="nav-link"
                id="history-tab"
                data-bs-toggle="tab"
                data-bs-target="#history"
                type="button"
                role="tab"
                aria-controls="history"
                aria-selected="false"
              >
                {t("History")}
              </button>
            </li>
          </ul>

          <div className="tab-content">
            <div
              className="tab-pane active"
              id="terms"
              role="tabpanel"
              aria-labelledby="terms-tab"
            >
              <h2 className="text-center">{t("Terms of use")}</h2>
              <TermsOfUse />
            </div>
            <div
              className="tab-pane"
              id="privacy"
              role="tabpanel"
              aria-labelledby="privacy-tab"
            >
              <h2 className="text-center">{t("Privacy policy")}</h2>
              <Privacy />
            </div>
            <div
              className="tab-pane"
              id="sources"
              role="tabpanel"
              aria-labelledby="sources-tab"
            >
              <h2 className="text-center">{t("Data sources")}</h2>
              <DataSources />
            </div>
            <div
              className="tab-pane"
              id="publications"
              role="tabpanel"
              aria-labelledby="publications-tab"
            >
              <h2 className="text-center">{t("Publications")}</h2>
              <Publications />
            </div>
            <div
              className="tab-pane"
              id="architecture"
              role="tabpanel"
              aria-labelledby="architecture-tab"
            >
              <h2 className="text-center">{t("System architecture")}</h2>
              <Architecture />
            </div>
            <div
              className="tab-pane"
              id="history"
              role="tabpanel"
              aria-labelledby="history-tab"
            >
              <h2 className="text-center">{t("History")}</h2>
              <History />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
