/* eslint-disable @typescript-eslint/ban-ts-comment */

import { SearchProvider } from "@elastic/react-search-ui";
import type { RequestState, SearchDriverOptions } from "@elastic/search-ui";
import type { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { CustomProvider } from "../../components/context/CustomContext";
import PatentDetails from "../../components/details/PatentDetails";
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

const indexName = process.env.INDEX_PATENT || "";

const routingOptions = {
  readUrl: () => "",
  writeUrl: () => {},
  urlToState: () => ({}) as RequestState,
  stateToUrl: () => "",
  routeChangeHandler: () => () => {},
};

export default function PatentDetailsPage() {
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
        title_text: {},
        "inventor.name_text": {},
      },
      result_fields: {
        id: {
          raw: {},
        },
        title: {
          raw: {},
        },
        applicant: {
          raw: [],
        },
        depositDate: {
          raw: {},
        },
        kindCode: {
          raw: {},
        },
        countryCode: {
          raw: {},
        },
        lattesTitle: {
          raw: [],
        },
        publicationDate: {
          raw: [],
        },
        inventor: {
          raw: [],
        },
        brcrisId: {
          raw: {},
        },
        IPCclassification: {
          raw: {},
        },
        CPCclassification: {
          raw: {},
        },
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
          <PatentDetails />
        </SearchProvider>
      </CustomProvider>
    </div>
  );
}
