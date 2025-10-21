/* eslint-disable @typescript-eslint/ban-ts-comment */
import type { GetStaticProps } from "next";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

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
const History = () => {
  const { t } = useTranslation(["about", "common"]);
  return (
    <>
      <p>
        {t(
          "In order to know how science evolves, who are its actors, what has been investigated, how knowledge is disseminated and communicated, and what future trends are, it is necessary to have a mechanism for consulting academic/technical/scientific information. The real understanding of science depends on the comprehensiveness, completeness and organization of where information is collected. It is in this context that BrCris is inserted.",
        )}
      </p>
      <p>
        {t(
          "We can understand BrCris as a national information management ecosystem that facilitates the collection, organization, storage and dissemination of information related to scientific research in the context of Brazil (publications, collaborations, patents, research projects and training of masters and doctors). Nowadays, BrCris, alongside other systems such as PTCRIS, has become a world reference on a system with computational support that covers all the science of a country, enabling a comprehensive and up-to-date view of research activities in an institution or even a specific thematic area.",
        )}
      </p>
      <p>
        {t(
          "BrCris has been tested with different pilots/case studies and presents a simple and intuitive interface for consulting academic information. The objective is to make bibliometric information available together with quantitative (and in the future qualitative) indicators, as well as visualization in different dashboards. The aim is to make the information available according to standards disciplined by Open Science.",
        )}
      </p>
      <p>
        {t(
          "Led by the Brazilian Institute of Information in Science and Technology (Ibict), the BrCris Project was officially born in 2014 as an integrated national research information ecosystem to support the ST&I activities developed in Brazil, in accordance with international best practices and standards.",
        )}
      </p>
      <p>
        {t(
          "BrCris, as an ecosystem, was designed and is being built with the participation of different people. Since its creation, a total of more than 55 people have worked directly with BrCris (PhD professors, software developers, information technologists, undergraduates, master's students and doctors from the most diverse areas of knowledge. The academic institutions of these professionals include, in alphabetical order: CEFET-MG, Ibict, Fiocruz, UFABC, UFC, UFRGS, UFRJ, UFSC, UFSCar, UnB and PUC-RJ. The project also had support and funding from the following funding agencies: CNPq, FAPDF and FINEP.",
        )}
      </p>
      <p>
        {t(
          "The development of BrCris allowed the improvement and transfer of technical-scientific knowledge, especially of collaborators still in training as are undergraduates, masters and doctoral students. This complement to academic training is intangible, but extremely important to help the student's career, since BrCris is developed and monitored with frequent meetings where, in addition to technical issues, activities and discussion on scientific research are highlighted.",
        )}
      </p>
      <p>
        {t(
          "Finally, it is important to highlight that BrCris was considered as an object of study in more than 47 research documents (scientific articles).",
        )}
      </p>
    </>
  );
};

export default History;
