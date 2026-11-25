import type { GetStaticProps } from "next";
import Head from "next/head";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useEffect } from "react";
import PageHeader from "../../components/panels/PageHeader";
import ThesesBigNumbers from "../../components/panels/ThesesBigNumbers";
import ArticlesByYearChart from "../../components/panels/ArticlesByYearChart";
import ThesesByYearChart from "../../components/panels/ThesesByYearChart";
import ThesesCoursesChart from "../../components/panels/ThesesCoursesChart";
import ThesesInstitutionsChart from "../../components/panels/ThesesInstitutionsChart";
import ThesesKeywordsCloud from "../../components/panels/ThesesKeywordsCloud";
import ThesesListTable from "../../components/panels/ThesesListTable";
import useRequest from "../../hooks/useRequest";
import { withBasePath } from "../../lib/basePath";
import type { ThesesSummaryResponse } from "../../types/ThesesDashboard";

type Props = {};

export const getStaticProps: GetStaticProps<Props> = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? "pt-BR", ["common", "navbar"])),
  },
});

export default function ThesesDashboard() {
  const { t } = useTranslation(["common", "navbar"]);
  const { data, loading, error, get } = useRequest<ThesesSummaryResponse>();

  useEffect(() => {
    get(withBasePath("/api/dashboard/theses-summary"));
  }, [get]);

  return (
    <>
      <Head>
        <title>{`BrCris - ${t("Theses and Dissertations")}`}</title>
      </Head>
      <div className="page-search">
        <div className="App">
          <div className="container page">
            <PageHeader
              title={t("Theses and Dissertations")}
              subtitle={t("Theses panel subtitle")}
            />

            <ThesesBigNumbers
              summary={data?.summary}
              loading={loading}
              error={Boolean(error)}
            />

            <div className="row g-3 mb-3">
              <div className="col-12 col-lg-6">
                <ThesesByYearChart />
              </div>
              <div className="col-12 col-lg-6">
                <ArticlesByYearChart />
              </div>
            </div>

            <div className="row g-3 mb-3">
              <div className="col-12 col-lg-6">
                <ThesesInstitutionsChart />
              </div>
              <div className="col-12 col-lg-6">
                <ThesesCoursesChart />
              </div>
            </div>

            <div className="row g-3 mb-3">
              <div className="col-12">
                <ThesesKeywordsCloud />
              </div>
            </div>

            <div className="row g-3 mb-3">
              <div className="col-12">
                <ThesesListTable />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
