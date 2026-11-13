import type { GetStaticProps } from "next";
import Head from "next/head";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useEffect } from "react";
import PageHeader from "../../components/panels/PageHeader";
import SoftwareByYearChart from "../../components/panels/SoftwareByYearChart";
import SoftwareLanguagesChart from "../../components/panels/SoftwareLanguagesChart";
import SoftwareSectorLanguageHeatmap from "../../components/panels/SoftwareSectorLanguageHeatmap";
import SoftwareBigNumbers from "../../components/panels/SoftwareBigNumbers";
import useRequest from "../../hooks/useRequest";
import { withBasePath } from "../../lib/basePath";
import type { SoftwareSummaryResponse } from "../../types/SoftwareDashboard";

type Props = {};

export const getStaticProps: GetStaticProps<Props> = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? "pt-BR", ["common", "navbar"])),
  },
});

export default function SoftwareDashboard() {
  const { t } = useTranslation(["common", "navbar"]);
  const { data, loading, error, get } = useRequest<SoftwareSummaryResponse>();

  useEffect(() => {
    get(withBasePath("/api/dashboard/software-summary"));
  }, [get]);

  return (
    <>
      <Head>
        <title>{`BrCris - ${t("Software")}`}</title>
      </Head>
      <div className="page-search">
        <div className="App">
          <div className="container page">
            <PageHeader
              title={t("Software")}
              subtitle={t("Software panel subtitle")}
            />

            <SoftwareBigNumbers
              summary={data?.summary}
              loading={loading}
              error={Boolean(error)}
            />

            <div className="row g-3">
              <div className="col-12">
                <SoftwareByYearChart />
              </div>
              <div className="col-12 col-lg-6">
                <SoftwareLanguagesChart />
              </div>
              <div className="col-12 col-lg-6">
                <SoftwareSectorLanguageHeatmap />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
