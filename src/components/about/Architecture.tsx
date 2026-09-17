import type { GetStaticProps } from "next";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { withBasePath } from "../../lib/basePath";

type Props = {};
// or getServerSideProps: GetServerSideProps<Props> = async ({ locale })
export const getStaticProps: GetStaticProps<Props> = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? "en", [
      "about",
      "navbar",
      "common",
    ])),
  },
});
const Architecture = () => {
  const { t } = useTranslation(["about", "common"]);
  return (
    <>
      <p>
        {t(
          "The architecture of BrCris is based on the description and mapping of connections between the different agents of the Brazilian scientific research ecosystem, among which are: researchers, funders, projects, organizations, laboratory and equipment infrastructures and research results (scientific publications, patents, etc.).",
        )}
      </p>
      <br />
      <picture className="d-flex justify-content-center">
        <img
          className="img-fluid"
          src={withBasePath("/images/BrCris_entidades_eng.png")}
          alt="entidades que compõe o BrCris"
        />
      </picture>
      <br />
      <p>
        <span
          dangerouslySetInnerHTML={{
            __html:
              t(
                "It is based on the infrastructure of Brazilian scientific repositories and journals, these aggregated by the Oasisbr Portal <https://oasisbr.ibict.br>, based on the software provided by the LA Referencia network. Information is collected from national and international sources. All the information collected is duplicated and exported to indexes of the Elasticsearch search engine.",
              ) || "",
          }}
        />
      </p>

      <br />
      <picture className="d-flex justify-content-center">
        <img
          className="img-fluid"
          src={withBasePath("/images/ecossistema.jpeg")}
          alt="entidades que compõe o ecossistema do BrCris"
        />
      </picture>
      <br />
      <p>
        {t(
          "Under the Elasticsearch indexes a search interface is generated, and a set of indicator dashboards that allow visualizations on individual records of different agents of the Ecosystem.",
        )}
      </p>
    </>
  );
};

export default Architecture;
