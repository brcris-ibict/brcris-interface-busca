import type { GetStaticProps } from "next";
import Head from "next/head";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import PageHeader from "../../components/paineis/PageHeader";
import FiltrosPublicacoes from "../../components/paineis/FiltrosPublicacoes";
import DistribuicaoAnualPorTipo from "../../components/paineis/DistribuicaoAnualPorTipo";
import DistribuicaoPorTipo from "../../components/paineis/DistribuicaoPorTipo";

type Props = {};

export const getStaticProps: GetStaticProps<Props> = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? "pt-BR", ["common", "navbar"])),
  },
});

export default function Publicacoes() {
  const { t } = useTranslation(["common", "navbar"]);

  /*
  type SerieAnual = {
    anos: string[];
    data: number[];
  };

  const { data, loading, error, get, post } = useRequest<SerieAnual>();

  // GET
  useEffect(() => {
    get(
      `/api/paineis/publicacoes/anual?year=${filtros.publicationDate}&type=${filtros.type}&language=${filtros.language}`,
    );
  }, [filtros, get]);

  // POST
  useEffect(() => {
    post("/api/paineis/publicacoes/anual", {
      year: filtros.publicationDate,
      type: filtros.type,
      language: filtros.language,
    });
  }, [filtros, post]);
  */

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
              actions={<FiltrosPublicacoes />}
            />

            <div className="row g-3">
              <div className="col-12 col-lg-8">
                <DistribuicaoAnualPorTipo />
              </div>
              <div className="col-12 col-lg-4">
                <DistribuicaoPorTipo />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
