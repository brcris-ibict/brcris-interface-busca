import type { GetStaticProps } from "next";
import Head from "next/head";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useEffect, useState } from "react";
import AnnualByTypeDistribution from "../../components/panels/AnnualByTypeDistribution";
import AnnualDistribution from "../../components/panels/AnnualDistribution";
import InstitutionDistribution from "../../components/panels/InstitutionDistribution";
import LanguageDistribution from "../../components/panels/LanguageDistribution";
import TopJournalsArticlesTable from "../../components/panels/TopJournalsArticlesTable";
import AuthorsProductionsTable from "../../components/panels/AuthorsProductionsTable";
import TypeDistribution from "../../components/panels/TypeDistribution";
import PublicationsBigNumbers from "../../components/panels/PublicationsBigNumbers";
import PublicationsFilters from "../../components/panels/PublicationsFilters";
import PageHeader from "../../components/panels/PageHeader";
import useRequest from "../../hooks/useRequest";
import { withBasePath } from "../../lib/basePath";
import type { PublicationsDashboardFilterOptions, PublicationsDashboardFilters, PublicationsDashboardResponse } from "../../types/PublicationsDashboard";

type Props = {};

const EMPTY_FILTER_OPTIONS: PublicationsDashboardFilterOptions = {
  publicationDates: [],
  types: [],
  languages: [],
  institutions: [],
};

function buildPublicationsUrl(filters: PublicationsDashboardFilters) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([field, value]) => {
    if (value) params.set(field, value);
  });

  const query = params.toString();
  return query ? withBasePath(`/api/dashboard/publications?${query}`) : withBasePath("/api/dashboard/publications");
}

export const getStaticProps: GetStaticProps<Props> = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? "pt-BR", ["common", "navbar"])),
  },
});

export default function Publications() {
  
  const { t } = useTranslation(["common", "navbar"]);
  const [filters, setFilters] = useState<PublicationsDashboardFilters>({
    publicationDate: "",
    type: "",
    language: "",
    institution: "",
  });

  const { data, loading, error, get } = useRequest<PublicationsDashboardResponse>();

  useEffect(() => {
    get(buildPublicationsUrl(filters));

  }, [filters, get]);

  const filterOptions = data?.filterOptions ?? EMPTY_FILTER_OPTIONS;

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
              actions={
                <PublicationsFilters
                  value={filters}
                  options={filterOptions}
                  onChange={setFilters}
                />
              }
            />

            <PublicationsBigNumbers
              summary={data?.summary}
              loading={loading}
              error={Boolean(error)}
            />

            <div className="row g-3">
              <div className="col-12 col-xl-6">
                <AnnualDistribution
                  data={data?.annual ?? []}
                  loading={loading}
                  error={Boolean(error)}
                  height={280}
                />
              </div>
              <div className="col-12 col-xl-6">
                <AnnualByTypeDistribution
                  data={data?.annualByType ?? []}
                  loading={loading}
                  error={Boolean(error)}
                  height={280}
                />
              </div>
              <div className="col-12 col-lg-4">
                <TypeDistribution
                  data={data?.byType ?? []}
                  totalPublications={data?.total}
                  loading={loading}
                  error={Boolean(error)}
                />
              </div>
              <div className="col-12 col-lg-4">
                <LanguageDistribution
                  data={data?.byLanguage ?? []}
                  totalPublications={data?.total}
                  publicationsWithoutLanguage={
                    data?.publicationsWithoutLanguage ?? 0
                  }
                  loading={loading}
                  error={Boolean(error)}
                />
              </div>
              <div className="col-12 col-lg-4">
                <InstitutionDistribution
                  data={data?.byInstitution ?? []}
                  totalPublications={data?.total}
                  publicationsWithoutInstitution={
                    data?.publicationsWithoutInstitution ?? 0
                  }
                  loading={loading}
                  error={Boolean(error)}
                />
              </div>
              <div className="col-12 col-lg-6">
                <TopJournalsArticlesTable
                  data={data?.topJournalsArticles}
                  loading={loading}
                  error={Boolean(error)}
                />
              </div>
              <div className="col-12 col-lg-6">
                <AuthorsProductionsTable
                  data={data?.authors}
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
