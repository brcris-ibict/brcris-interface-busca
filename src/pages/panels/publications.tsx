import type { GetStaticProps } from "next";
import Head from "next/head";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useEffect, useState } from "react";
import AnnualDistribution from "../../components/panels/AnnualDistribution";
import LanguageDistribution from "../../components/panels/LanguageDistribution";
import TypeDistribution from "../../components/panels/TypeDistribution";
import PublicationsFilters from "../../components/panels/PublicationsFilters";
import PageHeader from "../../components/panels/PageHeader";
import useRequest from "../../hooks/useRequest";
import type {
  PublicationsDashboardFilterOptions,
  PublicationsDashboardFilters,
  PublicationsDashboardResponse,
} from "../../types/PublicationsDashboard";

type Props = {};

const EMPTY_FILTER_OPTIONS: PublicationsDashboardFilterOptions = {
  publicationDates: [],
  types: [],
  languages: [],
};

function buildPublicationsUrl(filters: PublicationsDashboardFilters) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([field, value]) => {
    if (value) params.set(field, value);
  });

  const query = params.toString();
  return query
    ? `/api/dashboard/publications?${query}`
    : "/api/dashboard/publications";
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
  });

  const { data, loading, error, get } =
    useRequest<PublicationsDashboardResponse>();

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
              breadcrumbs={[
                { label: "BrCris", href: "/" },
                { label: t("Breadcrumb panels") },
                { label: t("navbar:Publications") },
              ]}
              actions={
                <PublicationsFilters
                  value={filters}
                  options={filterOptions}
                  onChange={setFilters}
                />
              }
            />

            <div className="row g-3">
              <div className="col-12">
                <AnnualDistribution
                  data={data?.annual ?? []}
                  loading={loading}
                  error={Boolean(error)}
                />
              </div>
              <div className="col-12 col-lg-6">
                <TypeDistribution
                  data={data?.byType ?? []}
                  loading={loading}
                  error={Boolean(error)}
                />
              </div>
              <div className="col-12 col-lg-6">
                <LanguageDistribution
                  data={data?.byLanguage ?? []}
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
