/* eslint-disable @typescript-eslint/ban-ts-comment */
import { useRouter } from 'next/router';
import { CustomProvider } from '../../components/context/CustomContext';
import { SearchProvider } from '@elastic/react-search-ui';
import APIConnector from '../../services/APIConnector';
import { RequestState, SearchDriverOptions } from '@elastic/search-ui';
import Loader from '../../components/Loader';
import { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import GroupDetails from '../../components/details/GroupDetails';

export const getServerSideProps: GetServerSideProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', ['common', 'navbar', 'advanced', 'facets'])),
  },
});

const indexName = process.env.INDEX_GROUP || '';

const routingOptions = {
  readUrl: () => '',
  writeUrl: () => {},
  urlToState: () => ({}) as RequestState,
  stateToUrl: () => '',
  routeChangeHandler: () => () => {},
};

export default function GroupDetailsPage() {
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
        name_text: {
          weight: 3,
        },
        'leader.name_text': {},
        'member.name_text': {},
        'orgunit.name_text': {},
      },
      result_fields: {
        name: {
          raw: {},
        },
        creationYear: {
          raw: {},
        },
        researchLine: {
          raw: {},
        },
        knowledgeArea: {
          raw: {},
        },
        description: {
          raw: {},
        },
        applicationSector: {
          raw: {},
        },
        keywords: {
          raw: [],
        },
        url: {
          raw: {},
        },
        status: {
          raw: {},
        },
        leader: {
          raw: {},
        },
        partner: {
          raw: {},
        },
        member: {
          raw: {},
        },
        orgunit: {
          raw: {},
        },
        software: {
          raw: {},
        },
        equipment: {
          raw: {},
        },
        brcrisId: {
          raw: {},
        },
        leaderResearcher: {
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
          <GroupDetails />
        </SearchProvider>
      </CustomProvider>
    </div>
  );
}
