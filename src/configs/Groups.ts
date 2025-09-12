/* eslint-disable @typescript-eslint/ban-ts-comment */

import CustomResultViewGroups from '../components/customResultView/CustomResultViewGroups';
import DefaultQueryConfig from '../components/DefaultQueryConfig';
import GroupsIndicators from '../components/indicators/GroupsIndicators';
import { CustomSearchDriverOptions } from '../types/Entities';
import { Index, SortOptionsType } from '../types/Propos';
import indexes from './Indexes';

const indexName = process.env.INDEX_GROUP || '';

const config: CustomSearchDriverOptions = {
  ...DefaultQueryConfig(),
  searchQuery: {
    index: indexName,
    operator: 'OR',
    advanced_fields: {
      creationYear: {},
      status: {},
    },
    search_fields: {
      name_text: {
        weight: 3,
      },
      'leaderResearcher.name_text': {},
      'leaderOrgUnit.name_text': {},
    },
    result_fields: {
      name: {
        snippet: {
          size: 100,
          fallback: true,
        },
      },
      leaderResearcher: {
        raw: {},
      },
      leaderOrgUnit: {
        raw: {},
      },
      researchLine: {
        raw: {},
      },
    },
    disjunctiveFacets: [],
    facets: {
      creationYear: { type: 'value' },
      researchLine: { type: 'value' },
      'leaderOrgUnit.name': { type: 'value' },
      status: { type: 'value' },
      'leaderResearcher.name': { type: 'value' },
    },
  },
};

const sortOptions: SortOptionsType[] = [
  {
    name: 'Relevance',
    value: [],
  },
  {
    name: 'Nome ASC',
    value: [
      {
        field: 'name',
        direction: 'asc',
      },
    ],
  },
  {
    name: 'Nome DESC',
    value: [
      {
        field: 'name',
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
  customView: CustomResultViewGroups,
  indicators: GroupsIndicators,
};

export default index;
