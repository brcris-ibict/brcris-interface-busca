/* eslint-disable react-hooks/exhaustive-deps */

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
import { Bar } from "react-chartjs-2";
import { CSVLink } from "react-csv";
import {
  CHART_BACKGROUD_COLORS,
  CHART_BORDER_COLORS,
} from "../../../utils/Utils";
import {
  EXCLUDE_LIBRARIES_FILTER_FIELD,
  excludeOrgLibraries,
  shouldExcludeOrgLibraries,
} from "../../lib/orgunitSearchQuery";
import indicatorProxyService from "../../services/IndicatorProxyService";
import styles from "../../styles/Indicators.module.css";
import type { CustomSearchQuery, IndicatorType } from "../../types/Entities";
import type { IndicatorsProps } from "../../types/Propos";
import IndicatorContext from "../context/CustomContext";
import { OptionsBar } from "./options/ChartsOptions";
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
const INDEX_NAME = process.env.INDEX_ORGUNIT || "";

const headersOrgUnit = [
  { label: "Country", key: "key" },
  { label: "Quantity", key: "doc_count" },
];
const headersOrgUnitState = [
  { label: "State", key: "key" },
  { label: "Quantity", key: "doc_count" },
];

function OrgUnitIndicators({
  filters,
  resultSearchTerm,
  isLoading,
}: IndicatorsProps) {
  const { t } = useTranslation("common");
  const options = new OptionsBar(t("Organizations by country"));
  const optionsState = new OptionsBar(t("Organizations by state"));
  const { driver } = useContext(SearchContext);
  const { indicators, setIndicatorsData, isEmpty } =
    useContext(IndicatorContext);

  const { search_fields, operator } = driver.searchQuery as CustomSearchQuery;
  const normalizedOperator = operator?.toUpperCase() === "OR" ? "OR" : "AND";
  // @ts-expect-error
  const fields = Object.keys(search_fields);

  useEffect(() => {
    // tradução
    const plugins = {
      ...options.plugins,
      title: {
        display: true,
        text: t(options.title),
        ...(options.plugins?.title ?? {}),
      },
    };
    options.plugins = plugins;

    const pluginsState = {
      ...optionsState.plugins,
      title: {
        display: true,
        text: t(optionsState.title),
        ...(optionsState.plugins?.title ?? {}),
      },
    };
    optionsState.plugins = pluginsState;

    const indicatorFilters =
      filters?.filter(
        (filter: { field: string }) =>
          filter.field !== EXCLUDE_LIBRARIES_FILTER_FIELD,
      ) ?? [];

    const countryQueryObj = getAggregateQuery({
      size: 10,
      indicadorName: "country",
      searchTerm: resultSearchTerm,
      fields,
      operator: normalizedOperator,
      filters: indicatorFilters,
    });
    const stateQueryObj = getAggregateQuery({
      size: 10,
      indicadorName: "state",
      searchTerm: resultSearchTerm,
      fields,
      operator: normalizedOperator,
      filters: indicatorFilters,
    });

    if (shouldExcludeOrgLibraries(filters)) {
      countryQueryObj.query = excludeOrgLibraries(countryQueryObj.query);
      stateQueryObj.query = excludeOrgLibraries(stateQueryObj.query);
    }

    const countryQuery = JSON.stringify(countryQueryObj);
    const stateQuery = JSON.stringify(stateQueryObj);
    if (isLoading) {
      indicatorProxyService
        .search([countryQuery, stateQuery], INDEX_NAME)
        .then((data) => {
          setIndicatorsData(data);
        });
    }
  }, [filters, resultSearchTerm, isLoading]);

  const countryIndicators: IndicatorType[] = indicators ? indicators[0] : [];
  const countryLabels =
    countryIndicators != null ? countryIndicators.map((d) => d.key) : [];

  const stateIndicators: IndicatorType[] = indicators ? indicators[1] : [];
  const stateLabels =
    stateIndicators != null ? stateIndicators.map((d) => d.key) : [];

  return (
    <div className="indicators" hidden={isEmpty()}>
      <div className={styles.chart}>
        {/* @ts-ignore */}
        <CSVLink
          className={styles.download}
          title="Export to csv"
          data={countryIndicators ? countryIndicators : []}
          filename={"arquivo.csv"}
          headers={headersOrgUnit}
        >
          <Download />
        </CSVLink>
        <Bar
          options={options}
          width="500"
          data={{
            labels: countryLabels,
            datasets: [
              {
                data: countryIndicators,
                label: t("Organizations") || "",
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
          filename={"arquivo.csv"}
          headers={headersOrgUnitState}
        >
          <Download />
        </CSVLink>
        <Bar
          options={optionsState}
          width="500"
          data={{
            labels: stateLabels,
            datasets: [
              {
                data: stateIndicators,
                label: t("Organizations") || "",
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
}))(OrgUnitIndicators);
