/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { SearchContext, withSearch } from '@elastic/react-search-ui';
import { useTranslation } from 'next-i18next';
import { useContext, useEffect } from 'react';
import { CSVLink } from 'react-csv';
import styles from '../../styles/Indicators.module.css';

import { ArcElement, BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Title, Tooltip } from 'chart.js';
import { Download } from 'lucide-react';
import { Bar, Pie } from 'react-chartjs-2';
import { CHART_BACKGROUD_COLORS, CHART_BORDER_COLORS } from '../../../utils/Utils';
import indicatorProxyService from '../../services/IndicatorProxyService';
import { CustomSearchQuery, IndicatorType } from '../../types/Entities';
import { IndicatorsProps } from '../../types/Propos';
import IndicatorContext from '../context/CustomContext';
import { OptionsBar, OptionsPie } from './options/ChartsOptions';
import { getAggregateQuery } from './query/Query';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);
const INDEX_NAME = process.env.INDEX_SOFTWARE || '';

const optPubDate = new OptionsBar('Software by release year');
const optknowledgeAreas = new OptionsPie('Software by knowledge area');

const headersByReleaseYear = [
  { label: 'Release year', key: 'key' },
  { label: 'Quantity', key: 'doc_count' },
];

const headersKnowledgeAreas = [
  { label: 'Knowledge area', key: 'key' },
  { label: 'Quantity', key: 'doc_count' },
];

function SoftwaresIndicators({ filters, resultSearchTerm, isLoading }: IndicatorsProps) {
  const { t } = useTranslation('common');

  const { driver } = useContext(SearchContext);
  const { indicators, setIndicatorsData, isEmpty } = useContext(IndicatorContext);
  const { search_fields, operator } = driver.searchQuery as CustomSearchQuery;
  // @ts-ignore
  const fields = Object.keys(search_fields);

  useEffect(() => {
    // tradução
    optPubDate.plugins.title.text = t(optPubDate.title);
    optknowledgeAreas.plugins.title.text = t(optknowledgeAreas.title);

    const queries = [
      JSON.stringify(
        getAggregateQuery({
          size: 10,
          indicadorName: 'releaseYear',
          searchTerm: resultSearchTerm,
          fields,
          operator,
          filters,
          order: { _key: 'desc' },
        })
      ),
      JSON.stringify(
        getAggregateQuery({
          size: 10,
          indicadorName: 'knowledgeAreas',
          searchTerm: resultSearchTerm,
          fields,
          operator,
          filters,
        })
      ),
    ];
    if (isLoading) {
      indicatorProxyService.search(queries, INDEX_NAME).then((data) => {
        setIndicatorsData(data);
      });
    }
  }, [filters, resultSearchTerm, isLoading]);

  //  release date
  const releaseYearIndicators: IndicatorType[] = indicators ? indicators[0] : [];
  const releaseYearLabels = releaseYearIndicators != null ? releaseYearIndicators.map((d) => d.key) : [];

  // country Code
  const knowledgeAreasIndicators: IndicatorType[] = indicators ? indicators[1] : [];
  const knowledgeAreasLabels = knowledgeAreasIndicators != null ? knowledgeAreasIndicators.map((d) => d.key) : [];
  const knowledgeAreasCount = knowledgeAreasIndicators != null ? knowledgeAreasIndicators.map((d) => d.doc_count) : [];

  releaseYearIndicators && releaseYearIndicators.sort((a, b) => Number(a.key) - Number(b.key));

  return (
    <div className="indicators" hidden={isEmpty()}>
      <div className={styles.chart}>
        {/* @ts-ignore */}
        <CSVLink
          className={styles.download}
          title="Export to csv"
          data={releaseYearIndicators ? releaseYearIndicators : []}
          filename={'arquivo.csv'}
          headers={headersByReleaseYear}
        >
          <Download />
        </CSVLink>
        <Bar
          /**
      // @ts-ignore */
          options={optPubDate}
          width="500"
          data={{
            labels: releaseYearLabels,
            datasets: [
              {
                data: releaseYearIndicators,
                label: 'Articles per Year',
                backgroundColor: CHART_BACKGROUD_COLORS,
                borderColor: CHART_BORDER_COLORS,
                borderWidth: 1,
              },
            ],
          }}
        />
      </div>

      <div className={styles.chart} hidden={knowledgeAreasIndicators == null}>
        {/* @ts-ignore */}
        <CSVLink
          className={styles.download}
          title={t('Export to csv') || ''}
          data={knowledgeAreasIndicators ? knowledgeAreasIndicators : []}
          filename={'arquivo.csv'}
          headers={headersKnowledgeAreas}
        >
          <Download />
        </CSVLink>
        <Pie
          /**
      // @ts-ignore */
          options={optknowledgeAreas}
          width="500"
          data={{
            labels: knowledgeAreasLabels,
            datasets: [
              {
                data: knowledgeAreasCount,
                label: '# of Votes',
                backgroundColor: CHART_BACKGROUD_COLORS,
                borderColor: CHART_BORDER_COLORS,
                borderWidth: 1,
              },
            ],
          }}
        />
      </div>
    </div>
  );
}
export default withSearch(
  // @ts-ignore
  ({ filters, resultSearchTerm, isLoading }) => ({
    filters,
    resultSearchTerm,
    isLoading,
  })
)(SoftwaresIndicators);
