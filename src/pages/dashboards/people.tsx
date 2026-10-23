import type { GetStaticProps } from "next";
import Head from "next/head";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useEffect, useState } from "react";
import NationalityDistribution from "../../components/panels/NationalityDistribution";
import KnowledgeAreasTreemap from "../../components/panels/KnowledgeAreasTreemap";
import TypeDistribution from "../../components/panels/TypeDistribution";
import AffiliationDistributionTable from "../../components/panels/AffiliationDistributionTable";
import PageHeader from "../../components/panels/PageHeader";
import PeopleBigNumbers from "../../components/panels/PeopleBigNumbers";
import PeopleFilters from "../../components/panels/PeopleFilters";
import useRequest from "../../hooks/useRequest";
import { withBasePath } from "../../lib/basePath";
import type {
  PeopleDashboardFilters,
  PeopleDashboardResponse,
} from "../../types/PeopleDashboard";

type Props = {};

// Removido: buildPeopleUrl
function buildPeopleUrl(filters: PeopleDashboardFilters) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([field, value]) => {
    if (value) params.set(field, value);
  });

  const query = params.toString();
  return query ? withBasePath(`/api/dashboard/people?${query}`) : withBasePath("/api/dashboard/people");
}

// Removido: getStaticProps
export const getStaticProps: GetStaticProps<Props> = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? "pt-BR", ["common", "navbar"])),
  },
});

export default function PeopleDashboard() {
  const { t } = useTranslation(["common", "navbar"]);
  const [filters, setFilters] = useState<PeopleDashboardFilters>({});
  const { data, loading, error, get } = useRequest<PeopleDashboardResponse>();

  useEffect(() => {
    get(buildPeopleUrl(filters));
  }, [filters, get]);

  return (
    <>
      <Head>
        <title>{`BrCris - ${t("People")}`}</title>
      </Head>
      <div className="page-search">
        <div className="App">
          <div className="container page">
            <PageHeader
              title={t("People")}
              subtitle={t("People panel subtitle")}
              actions={
                <PeopleFilters
                  value={filters}
                  onChange={setFilters}
                  disabled={loading}
                />
              }
            />

            <PeopleBigNumbers
              summary={data?.summary}
              loading={loading}
              error={Boolean(error)}
            />

            <div className="row g-3">
              <div className="col-12 col-lg-6">
                <NationalityDistribution
                  data={data?.byNationality ?? []}
                  totalResearchers={data?.summary.total}
                  researchersWithoutNationality={
                    data?.researchersWithoutNationality ?? 0
                  }
                  loading={loading}
                  error={Boolean(error)}
                />
              </div>
              <div className="col-12 col-lg-6">
                <KnowledgeAreasTreemap
                  filters={filters as any}
                  height={460}
                />
              </div>
              <div className="col-12 col-lg-6">
                <TypeDistribution
                  data={data?.byPublicationType ?? []}
                  totalPublications={data?.summary.withPublications}
                  loading={loading}
                  error={Boolean(error)}
                />
              </div>
              <div className="col-12 col-lg-6">
                <AffiliationDistributionTable
                  data={data?.byAffiliation ?? []}
                  loading={loading}
                  error={Boolean(error)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
