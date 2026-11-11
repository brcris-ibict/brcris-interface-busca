import type { GetStaticProps } from "next";
import Head from "next/head";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useEffect } from "react";
import AreaInstitutionTreemap from "../../components/panels/AreaInstitutionTreemap";
import ProgramListTable from "../../components/panels/ProgramListTable";
import ProgramPublicationsTable from "../../components/panels/ProgramPublicationsTable";
import ProgramsTermsBarChart from "../../components/panels/ProgramsTermsBarChart";
import PageHeader from "../../components/panels/PageHeader";
import ProgramsBigNumbers from "../../components/panels/ProgramsBigNumbers";
import useRequest from "../../hooks/useRequest";
import { withBasePath } from "../../lib/basePath";
import type { ProgramsSummaryResponse } from "../../types/ProgramsDashboard";

type Props = {};

export const getStaticProps: GetStaticProps<Props> = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? "pt-BR", ["common", "navbar"])),
  },
});

export default function ProgramsDashboard() {
  const { t } = useTranslation(["common", "navbar"]);
  const { data, loading, error, get } = useRequest<ProgramsSummaryResponse>();

  useEffect(() => {
    get(withBasePath("/api/dashboard/programs-summary"));
  }, [get]);

  return (
    <>
      <Head>
        <title>{`BrCris - ${t("Programs")}`}</title>
      </Head>
      <div className="page-search">
        <div className="App">
          <div className="container page">
            <PageHeader
              title={t("Programs")}
              subtitle={t("Programs panel subtitle")}
            />

            <ProgramsBigNumbers
              summary={data?.summary}
              loading={loading}
              error={Boolean(error)}
            />

            <div className="row g-3">
              <div className="col-12">
                <AreaInstitutionTreemap height={420} />
              </div>
              <div className="col-12 col-lg-6">
                <ProgramsTermsBarChart
                  by="capesArea"
                  titleKey="Programs by knowledge area"
                  captionKey="Programs by knowledge area caption"
                  nameHeaderKey="CAPES area"
                  filename="programas-por-area-do-conhecimento"
                />
              </div>
              <div className="col-12 col-lg-6">
                <ProgramsTermsBarChart
                  by="institution"
                  titleKey="Programs by institution"
                  captionKey="Programs by institution caption"
                  nameHeaderKey="Institution"
                  filename="programas-por-instituicao"
                />
              </div>
              <div className="col-12 col-lg-6">
                <ProgramsTermsBarChart
                  by="networkSize"
                  titleKey="Networked programs by size"
                  captionKey="Networked programs by size caption"
                  nameHeaderKey="Number of institutions"
                  filename="programas-em-rede-por-tamanho"
                  translateNames
                  height={320}
                />
              </div>
              <div className="col-12 col-lg-6">
                <ProgramPublicationsTable />
              </div>
              <div className="col-12 col-lg-6">
                <ProgramListTable />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
