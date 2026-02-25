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
import PopoverButton from "../PopOver";
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
const INDEX_NAME = process.env.INDEX_PUBLICATION || "";
export const options = new OptionsBar("Publicatons by year");
export const optionsType = new OptionsPie("Publicatons by type");

const headersPublicationsByYear = [
  { label: "Year", key: "key" },
  { label: "Quantity", key: "doc_count" },
];

const headersType = [
  { label: "Type", key: "key" },
  { label: "Quantity", key: "doc_count" },
];

function PublicationsIndicators({
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
    // tradução
    if (!options.plugins) options.plugins = {};
    if (!options.plugins.title)
      options.plugins.title = { display: true, text: "" };
    options.plugins.title.text = t(options.title);

    if (!optionsType.plugins) optionsType.plugins = {};
    if (!optionsType.plugins.title)
      optionsType.plugins.title = { display: true, text: "" };
    optionsType.plugins.title.text = t(optionsType.title);
    if (!resultSearchTerm) return;
    try {
      const pdQuery = JSON.stringify(
        getAggregateQuery({
          size: 10,
          indicadorName: "publicationDate",
          searchTerm: resultSearchTerm,
          fields,
          operator,
          filters,
          order: { _key: "desc" },
        }),
      );
      const typeQuery = JSON.stringify(
        getAggregateQuery({
          size: 10,
          indicadorName: "type",
          searchTerm: resultSearchTerm,
          fields,
          operator,
          filters,
        }),
      );
      indicatorProxyService
        .search([pdQuery, typeQuery], INDEX_NAME)
        .then((data) => {
          setIndicatorsData(data);
        });
    } catch (err) {
      console.error(err);
      setIndicatorsData([]);
    }
  }, [filters, resultSearchTerm, isLoading]);

  const yearIndicators: IndicatorType[] = indicators ? indicators[0] : [];
  const yearLabels =
    yearIndicators != null ? yearIndicators.map((d) => d.key) : [];
  const typeIndicators: IndicatorType[] = indicators ? indicators[1] : [];
  const typeLabels =
    typeIndicators != null ? typeIndicators.map((d) => d.key) : [];
  const typeDoc_count =
    typeIndicators != null ? typeIndicators.map((d) => d.doc_count) : [];

  yearIndicators &&
    yearIndicators.sort((a, b) => Number(a.key) - Number(b.key));

  return (
    <div className="indicators" hidden={isEmpty()}>
      <PopoverButton className="position-absolute" />
      <div className={styles.chart}>
        {/* @ts-ignore */}
        <CSVLink
          className={styles.download}
          title="Export to csv"
          data={yearIndicators ? yearIndicators : []}
          filename={"arquivo.csv"}
          headers={headersPublicationsByYear}
        >
          <Download />
        </CSVLink>
        <Bar
          options={options}
          width="500"
          data={{
            labels: yearLabels,
            datasets: [
              {
                data: yearIndicators,
                label: "Articles per Year",
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
          title={t("Export to csv") || ""}
          data={typeIndicators ? typeIndicators : []}
          filename={"arquivo.csv"}
          headers={headersType}
        >
          <Download />
        </CSVLink>
        <Pie
          options={optionsType}
          width="500"
          data={{
            labels: typeLabels,
            datasets: [
              {
                data: typeDoc_count,
                label: "# of Votes",
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
}))(PublicationsIndicators);
