import type { GetStaticProps } from "next";
import Head from "next/head";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

type Props = {
  // Add custom props here
};

export const getStaticProps: GetStaticProps<Props> = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? "en", ["navbar", "datasource"])),
  },
});

export default function DataSourceInfo() {
  const { t } = useTranslation(["datasource", "navbar", "common"]);

  return (
    <>
      <Head>
        <title>{`BrCris - ${t("Information about data sources")}`}</title>
      </Head>
      <div className="App">
        <div className="container page d-flex align-content-center flex-column">
          <div className="page-title">
            <h1 style={{ textTransform: "none" }}>
              {t("Information about data sources")}
            </h1>
          </div>
          <main>
            <h2>{t("User Profile Description")}</h2>
            <p>
              {t(
                "Data extracted from curriculums registered on the Lattes Platform",
              )}
            </p>

            <h2>{t("Research Areas")}</h2>
            <p>
              {t(
                "Areas of expertise extracted from curriculums registered on the Lattes Platform",
              )}
            </p>

            <h2>{t("Production Statistics")}</h2>
            <p>
              {t(
                "Data extracted from curriculums registered on the Lattes Platform, OpenAlex, and Capes Open Data",
              )}
            </p>

            <h2>{t("Scientific Collaborations")}</h2>
            <p>
              {t(
                "Collaborations identified in articles registered in curriculums on the Lattes Platform, OpenAlex, and Capes Open Data",
              )}
            </p>

            <h2>
              {t("Classification by Major Areas and Fields of Knowledge")}
            </h2>
            <p>
              {t(
                "Major areas and fields of knowledge extracted from articles registered in curriculums on the Lattes Platform",
              )}
            </p>

            <h2>{t("Academic Supervision")}</h2>
            <p>
              {t(
                "Supervision data extracted from curriculums registered on the Lattes Platform",
              )}
            </p>

            <h2>{t("Research Groups")}</h2>
            <p>{t("Data extracted from the CNPq Research Groups Directory")}</p>

            <h2>{t("Identifiers and Metadata")}</h2>
            <p>
              {t(
                "Data extracted from curriculums registered on the Lattes Platform, OpenAlex, Capes Open Data, and OasisBr",
              )}
            </p>
          </main>
        </div>
      </div>
    </>
  );
}
