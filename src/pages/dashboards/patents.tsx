import type { GetStaticProps } from "next";
import Head from "next/head";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useEffect } from "react";
import PageHeader from "../../components/panels/PageHeader";
import PatentsBigNumbers from "../../components/panels/PatentsBigNumbers";
import PatentsByYearChart from "../../components/panels/PatentsByYearChart";
import PatentsKindChart from "../../components/panels/PatentsKindChart";
import PatentsIpcTable from "../../components/panels/PatentsIpcTable";
import PatentsListTable from "../../components/panels/PatentsListTable";
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

            <div className="row g-3 mb-3">
              <div className="col-12">
                <PatentsByYearChart />
              </div>
            </div>

            <div className="row g-3">
              <div className="col-12 col-lg-6">
                <PatentsKindChart />
              </div>
              <div className="col-12 col-lg-6">
                <PatentsIpcTable />
              </div>
            </div>

            <div className="row g-3 mt-3">
              <div className="col-12">
                <PatentsListTable />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
