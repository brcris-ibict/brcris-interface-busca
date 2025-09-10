/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { useTranslation } from 'next-i18next';
import { useContext, useEffect } from 'react';
import { CSVLink } from 'react-csv';
import styles from '../../styles/Indicators.module.css';

import { Filter } from '@elastic/search-ui';
import { ArcElement, BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Title, Tooltip } from 'chart.js';
import { Download } from 'lucide-react';
import { Bar, Pie } from 'react-chartjs-2';
import { CHART_BACKGROUD_COLORS, CHART_BORDER_COLORS } from '../../../utils/Utils';
import indicatorProxyService from '../../services/IndicatorProxyService';
import { IndicatorType } from '../../types/Entities';
import IndicatorContext from '../context/CustomContext';
import { OptionsBar, OptionsPie } from '../indicators/options/ChartsOptions';
import { getAggregateQuery } from '../indicators/query/Query';
import PopoverButton from '../PopOver';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);
const INDEX_NAME = process.env.INDEX_PUBLICATION || '';
export const options = new OptionsBar('Publicatons by year');
export const optionsType = new OptionsPie('Publicatons by type');

const headersPublicationsByYear = [
  { label: 'Year', key: 'key' },
  { label: 'Quantity', key: 'doc_count' },
];

const headersType = [
  { label: 'Type', key: 'key' },
  { label: 'Quantity', key: 'doc_count' },
];

export default function PersonProduction({ authorId }: { authorId: string }) {
  const { t } = useTranslation('common');

  const { indicators, setIndicatorsData, isEmpty } = useContext(IndicatorContext);
  // @ts-ignore
  const fields = ['author.id'];
  const searchTerm = authorId;
  const filters: Filter[] = [];
  const operator = 'AND';

  useEffect(() => {
    // tradução
    // @ts-ignore
    options.plugins.title.text = t(options.title);
    // @ts-ignore
    optionsType.plugins.title.text = t(optionsType.title);
    try {
      const pdQuery = JSON.stringify(
        getAggregateQuery({
          size: 10,
          indicadorName: 'publicationDate',
          searchTerm,
          fields,
          operator,
          filters,
          order: { _key: 'desc' },
        })
      );
      const typeQuery = JSON.stringify(
        getAggregateQuery({
          size: 10,
          indicadorName: 'type',
          searchTerm,
          fields,
          operator,
          filters,
        })
      );
      indicatorProxyService.search([pdQuery, typeQuery], INDEX_NAME).then((data) => {
        setIndicatorsData(data);
      });
    } catch (err) {
      console.error(err);
      setIndicatorsData([]);
    }
  }, [authorId]);

  const yearIndicators: IndicatorType[] = indicators ? indicators[0] : [];
  const yearLabels = yearIndicators != null ? yearIndicators.map((d) => d.key) : [];
  const typeIndicators: IndicatorType[] = indicators ? indicators[1] : [];
  const typeLabels = typeIndicators != null ? typeIndicators.map((d) => d.key) : [];
  const typeDoc_count = typeIndicators != null ? typeIndicators.map((d) => d.doc_count) : [];

  yearIndicators && yearIndicators.sort((a, b) => Number(a.key) - Number(b.key));

  return (
    <div className="indicators" hidden={isEmpty()}>
      <PopoverButton />
      <h3>{t('Publication statistics')}</h3>
      <div className={styles.chart}>
        {/* @ts-ignore */}
        <CSVLink
          className={styles.download}
          title="Export to csv"
          data={yearIndicators ? yearIndicators : []}
          filename={'arquivo.csv'}
          headers={headersPublicationsByYear}
        >
          <Download />
        </CSVLink>
        <Bar
          /**
      // @ts-ignore */
          options={options}
          width="500"
          data={{
            labels: yearLabels,
            datasets: [
              {
                data: yearIndicators,
                label: 'Articles per Year',
                backgroundColor: CHART_BACKGROUD_COLORS,
                borderColor: CHART_BORDER_COLORS,
                borderWidth: 1,
              },
            ],
          }}
        />
      </div>

      <div className={styles.chart}>
        {/* @ts-ignore */}
        <CSVLink
          className={styles.download}
          title={t('Export to csv') || ''}
          data={typeIndicators ? typeIndicators : []}
          filename={'arquivo.csv'}
          headers={headersType}
        >
          <Download />
        </CSVLink>
        <Pie
          /**
      // @ts-ignore */
          options={optionsType}
          width="500"
          data={{
            labels: typeLabels,
            datasets: [
              {
                data: typeDoc_count,
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
