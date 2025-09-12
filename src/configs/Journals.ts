/* eslint-disable @typescript-eslint/ban-ts-comment */

import CustomResultViewJournals from '../components/customResultView/CustomResultViewJournals';
import DefaultQueryConfig from '../components/DefaultQueryConfig';
import JornalsIndicators from '../components/indicators/JornalsIndicators';
import { CustomSearchDriverOptions } from '../types/Entities';
import { Index, SortOptionsType } from '../types/Propos';
import indexes from './Indexes';

const indexName = process.env.INDEX_JOURNAL || '';

const config: CustomSearchDriverOptions = {
  ...DefaultQueryConfig(),
  searchQuery: {
    index: indexName,
    operator: 'OR',
    search_fields: {
      title_text: {
        weight: 3,
      },
      publisher: {},
      researchArea: {},
      issn: {},
    },

    result_fields: {
      id: {
        raw: {},
      },
      title: {
        snippet: {
          size: 100,
          fallback: true,
        },
      },
      publisher: {
        raw: {},
      },
      researchArea: {
        raw: {},
      },
    },
    disjunctiveFacets: [],

    facets: {
      type: { type: 'value' },
      'publisher.name': { type: 'value' },
      'researchArea.name': { type: 'value' },
    },
  },
  autocompleteQuery: {
    results: {
      resultsPerPage: 5,
      search_fields: {
        title_suggest: {
          weight: 3,
        },
      },
      result_fields: {
        title: {
          snippet: {
            size: 100,
            fallback: true,
          },
        },
      },
    },
    suggestions: {
      types: {
        results: { fields: ['title_completion'] },
      },
      size: 5,
    },
  },
};

const sortOptions: SortOptionsType[] = [
  {
    name: 'Relevance',
    value: [],
  },
  {
    name: 'Title ASC',
    value: [
      {
        field: 'title',
        direction: 'asc',
      },
    ],
  },
  {
    name: 'Title DESC',
    value: [
      {
        field: 'title',
        direction: 'desc',
      },
    ],
  },
];

const index: Index = {
  config,
  sortOptions,
  name: indexName,
  label: indexes.find((i) => i.name === indexName)?.label || '',
  customView: CustomResultViewJournals,
  indicators: JornalsIndicators,
};

export default index;
