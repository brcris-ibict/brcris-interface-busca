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
import indicatorProxyService from '../../services/IndicatorProxyService';
import { CustomSearchQuery, IndicatorType } from '../../types/Entities';
import { IndicatorsProps } from '../../types/Propos';
import IndicatorContext from '../context/CustomContext';
import { OptionsBar } from './options/ChartsOptions';
import { getAggregateQuery } from './query/Query';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);
const INDEX_NAME = process.env.INDEX_ORGUNIT || '';

const options = new OptionsBar('Organizations by country');
const optionsState = new OptionsBar('Organizations by state');

const headersOrgUnit = [
  { label: 'Country', key: 'key' },
  { label: 'Quantity', key: 'doc_count' },
];
const headersOrgUnitState = [
  { label: 'State', key: 'key' },
  { label: 'Quantity', key: 'doc_count' },
];

function OrgUnitIndicators({ filters, resultSearchTerm, isLoading }: IndicatorsProps) {
  const { t } = useTranslation('common');

  const { driver } = useContext(SearchContext);
  const { indicators, setIndicatorsData, isEmpty } = useContext(IndicatorContext);

  const { search_fields, operator } = driver.searchQuery as CustomSearchQuery;
  // @ts-ignore
  const fields = Object.keys(search_fields);

  useEffect(() => {
    // tradução
    // @ts-ignore
    options.plugins.title.text = t(options.title);
    // @ts-ignore
    optionsState.plugins.title.text = t(optionsState.title);

    const countryQuery = JSON.stringify(
      getAggregateQuery({
        size: 10,
        indicadorName: 'country',
        searchTerm: resultSearchTerm,
        fields,
        operator,
        filters,
      })
    );
    const stateQuery = JSON.stringify(
      getAggregateQuery({
        size: 10,
        indicadorName: 'state',
        searchTerm: resultSearchTerm,
        fields,
        operator,
        filters,
      })
    );
    if (isLoading) {
      indicatorProxyService.search([countryQuery, stateQuery], INDEX_NAME).then((data) => {
        setIndicatorsData(data);
      });
    }
  }, [filters, resultSearchTerm, isLoading]);

  const countryIndicators: IndicatorType[] = indicators ? indicators[0] : [];
  const countryLabels = countryIndicators != null ? countryIndicators.map((d) => d.key) : [];

  const stateIndicators: IndicatorType[] = indicators ? indicators[1] : [];
  const stateLabels = stateIndicators != null ? stateIndicators.map((d) => d.key) : [];

  return (
    <div className="indicators" hidden={isEmpty()}>
      <div className={styles.chart}>
        {/* @ts-ignore */}
        <CSVLink
          className={styles.download}
          title="Export to csv"
          data={countryIndicators ? countryIndicators : []}
          filename={'arquivo.csv'}
          headers={headersOrgUnit}
        >
          <Download />
        </CSVLink>
        <Bar
          /**
      // @ts-ignore */
          options={options}
          width="500"
          data={{
            labels: countryLabels,
            datasets: [
              {
                data: countryIndicators,
                label: t('Organizations') || '',
                backgroundColor: CHART_BACKGROUD_COLORS,
                borderColor: CHART_BORDER_COLORS,
                borderWidth: 1,
              },
            ],
          }}
        />
      </div>

      <div className={styles.chart} hidden={stateIndicators == null}>
        {/* @ts-ignore */}
        <CSVLink
          className={styles.download}
          title="Export to csv"
          data={stateIndicators ? stateIndicators : []}
          filename={'arquivo.csv'}
          headers={headersOrgUnitState}
        >
          <Download />
        </CSVLink>
        <Bar
          /**
      // @ts-ignore */
          options={optionsState}
          width="500"
          data={{
            labels: stateLabels,
            datasets: [
              {
                data: stateIndicators,
                label: t('Organizations') || '',
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
)(OrgUnitIndicators);
