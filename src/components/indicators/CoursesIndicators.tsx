/* eslint-disable react-hooks/exhaustive-deps */
/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <explanation> */
/* eslint-disable @typescript-eslint/ban-ts-comment */

import { SearchContext, withSearch } from "@elastic/react-search-ui";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from "chart.js";
import { Download } from "lucide-react";
import { useTranslation } from "next-i18next";
import { useContext, useEffect } from "react";
import { Bar, Pie } from "react-chartjs-2";
import { CSVLink } from "react-csv";
import {
  CHART_BACKGROUD_COLORS,
  CHART_BORDER_COLORS,
} from "../../../utils/Utils";
import indicatorProxyService from "../../services/IndicatorProxyService";
import styles from "../../styles/Indicators.module.css";
import type { CustomSearchQuery, IndicatorType } from "../../types/Entities";
import type { IndicatorsProps } from "../../types/Propos";
import IndicatorContext from "../context/CustomContext";
import { OptionsBar, OptionsPie } from "./options/ChartsOptions";
import { getAggregateQuery } from "./query/Query";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
);

const INDEX_NAME = process.env.INDEX_COURSE || "";

// Configurações dos gráficos
const optDegree = new OptionsPie("Courses by degree");
const optType = new OptionsPie("Courses by type");
const optStartYear = new OptionsBar("Courses by start year");
const optEndYear = new OptionsBar("Courses by end year");

const headersDegree = [
  { label: "Degree", key: "key" },
  { label: "Quantity", key: "doc_count" },
];

const headersType = [
  { label: "Type", key: "key" },
  { label: "Quantity", key: "doc_count" },
];

const headersStartYear = [
  { label: "Start year", key: "key" },
  { label: "Quantity", key: "doc_count" },
];

const headersEndYear = [
  { label: "End year", key: "key" },
  { label: "Quantity", key: "doc_count" },
];

function CoursesIndicators({
  filters,
  resultSearchTerm,
  isLoading,
}: IndicatorsProps) {
  const { t } = useTranslation("common");
  const { driver } = useContext(SearchContext);
  const { indicators, setIndicatorsData, isEmpty } =
    useContext(IndicatorContext);
  const { search_fields, operator } = driver.searchQuery as CustomSearchQuery;
  // @ts-expect-error
  const fields = Object.keys(search_fields);

  useEffect(() => {
    // Traduções dinâmicas
    optDegree.plugins.title.text = t(optDegree.title);
    optType.plugins.title.text = t(optType.title);
    optStartYear.plugins.title.text = t(optStartYear.title);
    optEndYear.plugins.title.text = t(optEndYear.title);

    const queries = [
      JSON.stringify(
        getAggregateQuery({
          size: 10,
          indicadorName: "degree",
          searchTerm: resultSearchTerm,
          fields,
          operator,
          filters,
        }),
      ),
      JSON.stringify(
        getAggregateQuery({
          size: 10,
          indicadorName: "type",
          searchTerm: resultSearchTerm,
          fields,
          operator,
          filters,
        }),
      ),
      JSON.stringify(
        getAggregateQuery({
          size: 10,
          indicadorName: "startDate",
          searchTerm: resultSearchTerm,
          fields,
          operator,
          filters,
          order: { _key: "asc" },
        }),
      ),
      JSON.stringify(
        getAggregateQuery({
          size: 10,
          indicadorName: "endDate",
          searchTerm: resultSearchTerm,
          fields,
          operator,
          filters,
          order: { _key: "asc" },
        }),
      ),
    ];

    if (isLoading) {
      indicatorProxyService.search(queries, INDEX_NAME).then((data) => {
        setIndicatorsData(data);
      });
    }
  }, [filters, resultSearchTerm, isLoading]);

  // Extração de dados
  const degreeIndicators: IndicatorType[] = indicators?.[0] ?? [];
  const typeIndicators: IndicatorType[] = indicators?.[1] ?? [];
  const startYearIndicators: IndicatorType[] = indicators?.[2] ?? [];
  const endYearIndicators: IndicatorType[] = indicators?.[3] ?? [];

  const degreeLabels = degreeIndicators.map((d) => d.key);
  const degreeCount = degreeIndicators.map((d) => d.doc_count);

  const typeLabels = typeIndicators.map((d) => d.key);
  const typeCount = typeIndicators.map((d) => d.doc_count);

  const startYearLabels = startYearIndicators.map((d) => d.key);
  const endYearLabels = endYearIndicators.map((d) => d.key);

  startYearIndicators.sort((a, b) => Number(a.key) - Number(b.key));
  endYearIndicators.sort((a, b) => Number(a.key) - Number(b.key));

  return (
    <div className="indicators" hidden={isEmpty()}>
      {/* Degree */}
      <div className={styles.chart} hidden={degreeIndicators == null}>
        {/* @ts-ignore */}
        <CSVLink
          className={styles.download}
          title={t("Export to csv") || ""}
          data={degreeIndicators || []}
          filename={"degree.csv"}
          headers={headersDegree}
        >
          <Download />
        </CSVLink>
        <Pie
          // @ts-expect-error
          options={optDegree}
          width="500"
          data={{
            labels: degreeLabels,
            datasets: [
              {
                data: degreeCount,
                label: "# of courses",
                backgroundColor: CHART_BACKGROUD_COLORS,
                borderColor: CHART_BORDER_COLORS,
                borderWidth: 1,
              },
            ],
          }}
        />
      </div>

      {/* Type */}
      <div className={styles.chart} hidden={typeIndicators == null}>
        {/* @ts-ignore */}
        <CSVLink
          className={styles.download}
          title={t("Export to csv") || ""}
          data={typeIndicators || []}
          filename={"type.csv"}
          headers={headersType}
        >
          <Download />
        </CSVLink>
        <Pie
          // @ts-expect-error
          options={optType}
          width="500"
          data={{
            labels: typeLabels,
            datasets: [
              {
                data: typeCount,
                label: "# of courses",
                backgroundColor: CHART_BACKGROUD_COLORS,
                borderColor: CHART_BORDER_COLORS,
                borderWidth: 1,
              },
            ],
          }}
        />
      </div>

      {/* Start Year */}
      <div className={styles.chart} hidden={startYearIndicators == null}>
        {/* @ts-ignore */}
        <CSVLink
          className={styles.download}
          title={t("Export to csv") || ""}
          data={startYearIndicators || []}
          filename={"start_year.csv"}
          headers={headersStartYear}
        >
          <Download />
        </CSVLink>
        <Bar
          // @ts-expect-error
          options={optStartYear}
          width="500"
          data={{
            labels: startYearLabels,
            datasets: [
              {
                data: startYearIndicators,
                label: "Courses by start year",
                backgroundColor: CHART_BACKGROUD_COLORS,
                borderColor: CHART_BORDER_COLORS,
                borderWidth: 1,
              },
            ],
          }}
        />
      </div>

      {/* End Year */}
      <div className={styles.chart} hidden={endYearIndicators == null}>
        {/* @ts-ignore */}
        <CSVLink
          className={styles.download}
          title={t("Export to csv") || ""}
          data={endYearIndicators || []}
          filename={"end_year.csv"}
          headers={headersEndYear}
        >
          <Download />
        </CSVLink>
        <Bar
          // @ts-expect-error
          options={optEndYear}
          width="500"
          data={{
            labels: endYearLabels,
            datasets: [
              {
                data: endYearIndicators,
                label: "Courses by end year",
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

export default withSearch(({ filters, resultSearchTerm, isLoading }) => ({
  filters,
  resultSearchTerm,
  isLoading,
}))(CoursesIndicators);
