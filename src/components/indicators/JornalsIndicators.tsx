/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { SearchContext, withSearch } from '@elastic/react-search-ui';
import { useTranslation } from 'next-i18next';
import { useContext, useEffect } from 'react';
import { CSVLink } from 'react-csv';
import styles from '../../styles/Indicators.module.css';

import { ArcElement, BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Title, Tooltip } from 'chart.js';
import { Download } from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import { CHART_BACKGROUD_COLORS, CHART_BORDER_COLORS } from '../../../utils/Utils';
import indicatorProxy from '../../services/IndicatorProxyService';
import { CustomSearchQuery, IndicatorType } from '../../types/Entities';
import { IndicatorsProps } from '../../types/Propos';
import IndicatorContext from '../context/CustomContext';
import { OptionsBar } from './options/ChartsOptions';
import { getAggregateQuery } from './query/Query';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);
const INDEX_NAME = process.env.INDEX_JOURNAL || '';

const optQualis = new OptionsBar('Journals by qualis');

const headersQualis = [
  { label: 'Qualis', key: 'key' },
  { label: 'Quantity', key: 'doc_count' },
];

function JornalsIndicators({ filters, resultSearchTerm, isLoading }: IndicatorsProps) {
  const { t } = useTranslation('common');

  const { driver } = useContext(SearchContext);
  const { indicators, setIndicatorsData, isEmpty } = useContext(IndicatorContext);
  const { search_fields, operator } = driver.searchQuery as CustomSearchQuery;
  // @ts-ignore
  const fields = Object.keys(search_fields);

  useEffect(() => {
    // tradução
    // @ts-ignore
    optQualis.plugins.title.text = t(optQualis.title);
    const queries = [
      JSON.stringify(
        getAggregateQuery({
          size: 10,
          indicadorName: 'qualis',
          searchTerm: resultSearchTerm,
          fields,
          operator,
          filters,
        })
      ),
    ];
    if (isLoading) {
      indicatorProxy.search(queries, INDEX_NAME).then((data) => {
        setIndicatorsData(data);
      });
    }
  }, [filters, resultSearchTerm, isLoading]);

  const qualisIndicators: IndicatorType[] = indicators ? indicators[0] : [];

  const qualisLabels = qualisIndicators != null ? qualisIndicators.map((d) => d.key) : [];

  return (
    <div className="indicators" hidden={isEmpty()}>
      <div className={styles.chart}>
        {/* @ts-ignore */}
        <CSVLink
          className={styles.download}
          title="Export to csv"
          data={qualisIndicators ? qualisIndicators : []}
          filename={'arquivo.csv'}
          headers={headersQualis}
        >
          <Download />
        </CSVLink>
        <Bar
          /**
      // @ts-ignore */
          options={optQualis}
          width="500"
          data={{
            labels: qualisLabels,
            datasets: [
              {
                data: qualisIndicators,
                label: 'Articles per Year',
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
)(JornalsIndicators);
