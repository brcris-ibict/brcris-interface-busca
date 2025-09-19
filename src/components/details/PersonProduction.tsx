/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { useTranslation } from 'next-i18next';
import { CSVLink } from 'react-csv';
import styles from '../../styles/Indicators.module.css';

import { ArcElement, BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Title, Tooltip } from 'chart.js';
import { Download } from 'lucide-react';
import { Bar, Pie } from 'react-chartjs-2';
import { CHART_BACKGROUD_COLORS, CHART_BORDER_COLORS } from '../../../utils/Utils';
import { IndicatorType } from '../../types/Entities';
import { OptionsBar, OptionsPie } from '../indicators/options/ChartsOptions';
import PopoverButton from '../PopOver';
import ChordDiagram from './ChordDiagram';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);
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

function aggregateByField(items: any[], field: string): IndicatorType[] {
  return Object.values(
    items.reduce((acc: any, item: any) => {
      // pega o valor do campo
      const rawKey = item[field];

      // normaliza: se for array, pega o primeiro valor
      const key = Array.isArray(rawKey) ? rawKey[0] : rawKey;

      if (!key) return acc; // ignora valores nulos ou undefined

      if (!acc[key]) {
        acc[key] = { key, doc_count: 0 };
      }
      acc[key].doc_count += 1;
      return acc;
    }, {})
  );
}

export default function PersonProduction({ publications }: { publications: any[] }) {
  const { t } = useTranslation('common');
  options.plugins.title.text = t(options.title);
  optionsType.plugins.title.text = t(optionsType.title);

  const yearIndicators: IndicatorType[] = aggregateByField(publications, 'publicationDate');
  const yearLabels = yearIndicators != null ? yearIndicators.map((d) => d.key) : [];
  const typeIndicators: IndicatorType[] = aggregateByField(publications, 'type');
  const typeLabels = typeIndicators != null ? typeIndicators.map((d) => d.key) : [];
  const typeDoc_count = typeIndicators != null ? typeIndicators.map((d) => d.doc_count) : [];

  yearIndicators && yearIndicators.sort((a, b) => Number(a.key) - Number(b.key));

  return (
    <div className="indicators">
      <PopoverButton />
      <div className="container py-5">
        <h2>Co-authorship Chord Diagram</h2>
        <ChordDiagram authorId="7ea9469a-1088-4913-aa01-d161d440f564" />
      </div>
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
