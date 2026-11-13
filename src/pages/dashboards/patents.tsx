import type { GetStaticProps } from "next";
import Head from "next/head";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useEffect } from "react";
import PageHeader from "../../components/panels/PageHeader";
import PatentsBigNumbers from "../../components/panels/PatentsBigNumbers";
import useRequest from "../../hooks/useRequest";
import { withBasePath } from "../../lib/basePath";
import type { PatentsSummaryResponse } from "../../types/PatentsDashboard";

type Props = {};

export const getStaticProps: GetStaticProps<Props> = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? "pt-BR", ["common", "navbar"])),
  },
});

export default function PatentsDashboard() {
  const { t } = useTranslation(["common", "navbar"]);
  const { data, loading, error, get } = useRequest<PatentsSummaryResponse>();

  useEffect(() => {
    get(withBasePath("/api/dashboard/patents-summary"));
  }, [get]);

  return (
    <>
      <Head>
        <title>{`BrCris - ${t("Patents")}`}</title>
      </Head>
      <div className="page-search">
        <div className="App">
          <div className="container page">
            <PageHeader
              title={t("Patents")}
              subtitle={t("Patents panel subtitle")}
            />

            <PatentsBigNumbers
              summary={data?.summary}
              loading={loading}
              error={Boolean(error)}
            />

            <div className="row g-3"></div>
          </div>
        </div>
      </div>
    </>
  );
}
