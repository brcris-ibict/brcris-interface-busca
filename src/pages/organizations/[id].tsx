/* eslint-disable @typescript-eslint/ban-ts-comment */
import { useRouter } from 'next/router';
import { CustomProvider } from '../../components/context/CustomContext';
import { SearchProvider } from '@elastic/react-search-ui';
import APIConnector from '../../services/APIConnector';
import { RequestState, SearchDriverOptions } from '@elastic/search-ui';
import Loader from '../../components/Loader';
import { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import OrganizationDetails from '../../components/details/OrganizationDetails';

export const getServerSideProps: GetServerSideProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', ['common', 'navbar', 'advanced', 'facets'])),
  },
});

const indexName = process.env.INDEX_ORGUNIT || '';

const routingOptions = {
  readUrl: () => '',
  writeUrl: () => {},
  urlToState: () => ({}) as RequestState,
  stateToUrl: () => '',
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
      filters: [{ field: '_id', type: 'all', values: [id!] }],
      resultsPerPage: 1,
    },
    searchQuery: {
      // @ts-ignore
      index: indexName,
      search_fields: {
        name_text: { weight: 3 },
        acronym_text: {},
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
        ciId: {
          raw: {},
        },
        gridId: {
          raw: {},
        },
        ringgoId: {
          raw: {},
        },
        rorid: {
          raw: {},
        },
        scopusId: {
          raw: {},
        },
        wikidataId: {
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
