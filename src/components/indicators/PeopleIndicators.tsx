/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { SearchContext, withSearch } from '@elastic/react-search-ui';
import { useContext, useEffect } from 'react';
import { CSVLink } from 'react-csv';
import styles from '../../styles/Indicators.module.css';

import { ArcElement, BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Title, Tooltip } from 'chart.js';
import { Pie } from 'react-chartjs-2';
// @ts-ignore
import { TagCloud } from 'react-tagcloud';
import indicatorProxy from '../../services/IndicatorProxyService';

import { Download } from 'lucide-react';
import { useTranslation } from 'next-i18next';
import { CHART_BACKGROUD_COLORS, CHART_BORDER_COLORS } from '../../../utils/Utils';
import { CustomSearchQuery, IndicatorType } from '../../types/Entities';
import { IndicatorsProps } from '../../types/Propos';
import IndicatorContext from '../context/CustomContext';
import { OptionsPie } from './options/ChartsOptions';
import { getAggregateQuery } from './query/Query';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);
const INDEX_NAME = process.env.INDEX_PERSON || '';

export const optionsResearchArea = new OptionsPie('Affiliation');

const headersNacionality = [
  { label: 'Nacionality', key: 'key' },
  { label: 'Quantity', key: 'doc_count' },
];

const headersResearchArea = [
  { label: 'Affiliation', key: 'key' },
  { label: 'Quantity', key: 'doc_count' },
];

function PeopleIndicators({ filters, resultSearchTerm }: IndicatorsProps) {
  const { t } = useTranslation('common');
  const { driver } = useContext(SearchContext);
  const { indicators, setIndicatorsData, isEmpty } = useContext(IndicatorContext);

  const { search_fields, operator } = driver.searchQuery as CustomSearchQuery;
  // @ts-ignore
  const fields = Object.keys(search_fields);

  useEffect(() => {
    // @ts-ignore
    optionsResearchArea.plugins.title.text = t(optionsResearchArea.title);
    try {
      const queries = [
        JSON.stringify(
          getAggregateQuery({
            size: 10,
            indicadorName: 'nationality',
            searchTerm: resultSearchTerm,
            fields,
            operator,
            filters,
          })
        ),
        JSON.stringify(
          getAggregateQuery({
            size: 10,
            indicadorName: 'affiliation.name',
            searchTerm: resultSearchTerm,
            fields,
            operator,
            filters,
          })
        ),
      ];
      indicatorProxy.search(queries, INDEX_NAME).then((data) => {
        setIndicatorsData(data);
      });
    } catch (err) {
      console.error(err);
      setIndicatorsData([]);
    }
  }, [filters, resultSearchTerm]);

  const nationalities: IndicatorType[] = indicators ? indicators[0] : [];

  const nationalitiesTagsCloud =
    nationalities != null ? nationalities.map((d) => ({ value: d.key, count: d.doc_count })) : [];

  const researchArea: IndicatorType[] = indicators ? indicators[1] : [];

  const researchAreaLabels = researchArea != null ? researchArea.map((d) => d.key) : [];

  const researchAreaValues = researchArea != null ? researchArea.map((d) => d.doc_count) : [];

  return (
    <div className="indicators" hidden={isEmpty()}>
      <div className={styles.chart}>
        {/* @ts-ignore */}
        <CSVLink
          className={styles.download}
          title="Export to csv"
          data={researchArea ? researchArea : []}
          filename={'arquivo.csv'}
          headers={headersResearchArea}
        >
          <Download />
        </CSVLink>
        <Pie
          /**
        // @ts-ignore */
          options={optionsResearchArea}
          data={{
            labels: researchAreaLabels,
            datasets: [
              {
                data: researchAreaValues,
                label: '# People',
                backgroundColor: CHART_BACKGROUD_COLORS,
                borderColor: CHART_BORDER_COLORS,
                borderWidth: 1,
              },
            ],
          }}
        />
      </div>

      <div className={styles.chart} hidden={nationalities == null || nationalities.length == 0}>
        <p
          style={{
            display: nationalities && nationalities.length > 0 ? 'block' : 'none',
          }}
          className={styles.title}
        >
          {t('Nationalities')}
        </p>
        {/* @ts-ignore */}
        <CSVLink
          className={styles.download}
          title="Exportar para csv"
          data={nationalities ? nationalities : []}
          filename={'arquivo.csv'}
          headers={headersNacionality}
        >
          <Download />
        </CSVLink>
        <TagCloud
          minSize={12}
          maxSize={35}
          tags={nationalitiesTagsCloud}
          // @ts-ignore
          style={{
            width: 300,
            textAlign: 'center',
          }}
          randomSeed={42}
          // onClick={(tag: any) =>
          //   alert(`'${JSON.stringify(tag)}' was selected!`)
          // }
        />
      </div>
    </div>
  );
}
// @ts-ignore
export default withSearch(
  // @ts-ignore
  ({ filters, resultSearchTerm }) => ({
    filters,
    resultSearchTerm,
  })
)(PeopleIndicators);
