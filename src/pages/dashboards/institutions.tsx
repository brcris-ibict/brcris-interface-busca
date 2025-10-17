/* eslint-disable @typescript-eslint/ban-ts-comment */
import type { GetStaticProps } from "next";
import Head from "next/head";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Iframe from "../../components/dashboards/Iframe";

//@ts-expect-error
type Props = {
  // Add custom props here
};
// or getServerSideProps: GetServerSideProps<Props> = async ({ locale })
export const getStaticProps: GetStaticProps<Props> = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? "en", ["common", "navbar"])),
  },
});

export default function OrganizationsDashboard() {
  const { t } = useTranslation("common");
  return (
    <>
      <Head>
        <title>{`BrCris - ${t("Organizations dashboard")}`}</title>
      </Head>
      <div className="page-search">
        <div className="App">
          <div className="container page">
            <div className="page-title">
              <h1>{t("Organizations dashboard")}</h1>
            </div>
            <Iframe url="https://dashboardbrcris.ibict.br/app/dashboards#/view/9d0006cc-d845-4dc1-bdd4-0f6dfb34e0be?embed=true&amp;_g=(filters%3A!()%2CrefreshInterval%3A(pause%3A!t%2Cvalue%3A0)%2Ctime%3A(from%3Anow-15m%2Cto%3Anow))" />
          </div>
        </div>
      </div>
    </>
  );
}
