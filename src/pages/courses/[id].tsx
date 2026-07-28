import { SearchProvider } from "@elastic/react-search-ui";
import type { RequestState, SearchDriverOptions } from "@elastic/search-ui";
import type { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { CustomProvider } from "../../components/context/CustomContext";
import CourseDetails from "../../components/details/CourseDetails";
import Loader from "../../components/Loader";
import APIConnector from "../../services/APIConnector";

export const getServerSideProps: GetServerSideProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? "en", [
      "common",
      "navbar",
      "advanced",
      "facets",
    ])),
  },
});

const indexName = process.env.INDEX_COURSE || "";

const routingOptions = {
  readUrl: () => "",
  writeUrl: () => {},
  urlToState: () => ({}) as RequestState,
  stateToUrl: () => "",
  routeChangeHandler: () => () => {},
};

export default function CourseDetailsPage() {
  const router = useRouter();
  const { id } = router.query;

  const config: SearchDriverOptions = {
    debug: false,
    alwaysSearchOnInitialLoad: true,
    routingOptions: routingOptions,
    apiConnector: new APIConnector(),
    initialState: {
      filters: [{ field: "_id", type: "all", values: [id!] }],
      resultsPerPage: 1,
    },
    searchQuery: {
      // @ts-expect-error
      index: indexName,
      search_fields: {
        name_text: {},
        "program.name_text": {},
        "orgUnit.name_text": {},
      },
      result_fields: {
        id: { raw: {} },
        name: { raw: {} },
        degree: { raw: {} },
        type: { raw: {} },
        startDate: { raw: {} },
        endDate: { raw: {} },
        program: { raw: [] },
        publication: { raw: [] },
        orgUnit: { raw: [] },
        brcrisId: { raw: {} },
        capesId: { raw: {} },
      },
    },
  };

  if (!id) {
    return <Loader />;
  }

  return (
    <div className="container details-page">
      <CustomProvider>
        <SearchProvider config={config}>
          <CourseDetails />
        </SearchProvider>
      </CustomProvider>
    </div>
  );
}
