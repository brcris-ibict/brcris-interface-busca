/* eslint-disable @typescript-eslint/ban-ts-comment */

import { SearchProvider } from "@elastic/react-search-ui";
import type { RequestState, SearchDriverOptions } from "@elastic/search-ui";
import type { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { CustomProvider } from "../../components/context/CustomContext";
import JournalDetails from "../../components/details/JournalDetails";
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

const indexName = process.env.INDEX_JOURNAL || "";

const routingOptions = {
  readUrl: () => "",
  writeUrl: () => {},
  urlToState: () => ({}) as RequestState,
  stateToUrl: () => "",
  routeChangeHandler: () => () => {},
};

export default function JournalDetailsPage() {
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
      searchTerm: id as string,
    },
    searchQuery: {
      // @ts-expect-error
      index: indexName,
      search_fields: {
        _id: {},
      },
      result_fields: {
        id: {
          raw: {},
        },
        accessType: {
          raw: {},
        },
        issn: {
          raw: {},
        },
        issn_l: {
          raw: {},
        },
        keywords: {
          raw: {},
        },
        language: {
          raw: {},
        },
        publisher: {
          raw: {},
        },
        qualis: {
          raw: {},
        },
        researchArea: {
          raw: {},
        },
        status: {
          raw: {},
        },
        title: {
          raw: {},
        },
        type: {
          raw: {},
        },
        openalexId: {
          raw: {},
        },
        isInDoaj: {
          raw: {},
        },
        isOA: {
          raw: {},
        },
        websiteUrl: {
          raw: {},
        },
        assessmentArea: {
          raw: {},
        },
        publication: {
          raw: {},
        },
        brcrisId: {
          raw: {},
        },
        countryCode: {
          raw: {},
        },
        googleH5: {
          raw: {},
        },
        h_index: {
          raw: {},
        },
        i10_index: {
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
          <JournalDetails />
        </SearchProvider>
      </CustomProvider>
    </div>
  );
}
