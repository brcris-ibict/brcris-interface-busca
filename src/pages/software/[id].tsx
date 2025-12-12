/* eslint-disable @typescript-eslint/ban-ts-comment */

import { SearchProvider } from "@elastic/react-search-ui";
import type { RequestState, SearchDriverOptions } from "@elastic/search-ui";
import type { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { CustomProvider } from "../../components/context/CustomContext";
import SoftwareDetails from "../../components/details/SoftwareDetails";
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

const indexName = process.env.INDEX_SOFTWARE || "";

const routingOptions = {
  readUrl: () => "",
  writeUrl: () => {},
  urlToState: () => ({}) as RequestState,
  stateToUrl: () => "",
  routeChangeHandler: () => () => {},
};

export default function SoftawareDetailsPage() {
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
        name_text: {
          weight: 3,
        },
      },
      result_fields: {
        id: {
          raw: {},
        },
        name: {
          raw: {},
        },
        title: {
          raw: {},
        },
        description: {
          raw: {},
        },
        creator: {
          raw: {},
        },

        depositDate: {
          raw: {},
        },
        releaseYear: {
          raw: {},
        },
        kind: {
          raw: {},
        },
        platform: {
          raw: {},
        },
        registrationCountry: {
          raw: {},
        },
        activitySector: {
          raw: {},
        },
        knowledgeAreas: {
          raw: {},
        },
        keywords: {
          raw: {},
        },
        language: {
          raw: {},
        },
        brcrisId: {
          raw: {},
        },
        inpiRegistrationCode: {
          raw: {},
        },
        doi: {
          raw: {},
        },
        inpiUrl: {
          raw: {},
        },
        registrationInstitution: {
          raw: {},
        },
        fundingInstitution: {
          raw: {},
        },
        availability: {
          raw: {},
        },
        environment: {
          raw: {},
        },
        concessionDate: {
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
          <SoftwareDetails />
        </SearchProvider>
      </CustomProvider>
    </div>
  );
}
