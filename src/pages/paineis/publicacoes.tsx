import type { GetStaticProps } from "next";
import Head from "next/head";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import PageHeader from "../../components/paineis/PageHeader";

type Props = {};

export const getStaticProps: GetStaticProps<Props> = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? "pt-BR", ["common", "navbar"])),
  },
});

export default function Publicacoes() {
  const { t } = useTranslation(["common", "navbar"]);

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
            />

            {/* Depois: filtros, big numbers, gráficos */}
          </div>
        </div>
      </div>
    </>
  );
}
