/* eslint-disable @typescript-eslint/ban-ts-comment */

import { SearchProvider } from "@elastic/react-search-ui";
import type { RequestState, SearchDriverOptions } from "@elastic/search-ui";
import type { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { CustomProvider } from "../../components/context/CustomContext";
import OrganizationDetails from "../../components/details/OrganizationDetails";
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

const indexName = process.env.INDEX_ORGUNIT || "";

const routingOptions = {
  readUrl: () => "",
  writeUrl: () => {},
  urlToState: () => ({}) as RequestState,
  stateToUrl: () => "",
  routeChangeHandler: () => () => {},
};

export default function OragnizationDetailsPage() {
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
        name_text: { weight: 3 },
        acronym: {},
        country: {},
        state: {},
        city: {},
      },
      result_fields: {
        name: {
          raw: {},
        },
        acronym: {
          raw: {},
        },
        country: {
          raw: {},
        },
        state: {
          raw: {},
        },
        city: {
          raw: {},
        },
        brcrisId: {
          raw: {},
        },
        coordinates: {
          raw: {},
        },
        member: {
          raw: {},
        },
        program: {
          raw: {},
        },
        course: {
          raw: {},
        },

        capesId: {
          raw: {},
        },
        publication: {
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
          <OrganizationDetails />
        </SearchProvider>
      </CustomProvider>
    </div>
  );
}
