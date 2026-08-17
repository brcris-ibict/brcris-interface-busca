import type { GetStaticProps } from "next";
import Head from "next/head";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useState } from "react";
import DistribuicaoAnualPorTipo from "../../components/paineis/DistribuicaoAnualPorTipo";
import DistribuicaoPorTipo from "../../components/paineis/DistribuicaoPorTipo";
import FiltrosPublicacoes from "../../components/paineis/FiltrosPublicacoes";
import PageHeader from "../../components/paineis/PageHeader";
import usePublicationsDashboard from "../../hooks/usePublicationsDashboard";
import type { PublicationsDashboardFilters } from "../../types/PublicationsDashboard";

type Props = {};

export const getStaticProps: GetStaticProps<Props> = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? "pt-BR", ["common", "navbar"])),
  },
});

export default function Publicacoes() {
  const { t } = useTranslation(["common", "navbar"]);
  const [filters, setFilters] = useState<PublicationsDashboardFilters>({
    publicationDate: "",
    type: "",
    language: "",
  });
  const { data, loading, error, filterOptions } =
    usePublicationsDashboard(filters);

  return (
    <>
      <Head>
        <title>{`BrCris - ${t("navbar:Publications")}`}</title>
      </Head>
      <div className="page-search">
        <div className="App">
          <div className="container page">
            <PageHeader
              title={t("navbar:Publications")}
              subtitle={t("Publications panel subtitle")}
              breadcrumbs={[
                { label: "BrCris", href: "/" },
                { label: t("Breadcrumb panels") },
                { label: t("navbar:Publications") },
              ]}
              actions={
                <FiltrosPublicacoes
                  value={filters}
                  options={filterOptions}
                  onChange={setFilters}
                />
              }
            />

            <div className="row g-3">
              <div className="col-12 col-lg-8">
                <DistribuicaoAnualPorTipo
                  data={data?.annual ?? []}
                  loading={loading}
                  error={error}
                />
              </div>
              <div className="col-12 col-lg-4">
                <DistribuicaoPorTipo
                  data={data?.byType ?? []}
                  loading={loading}
                  error={error}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
