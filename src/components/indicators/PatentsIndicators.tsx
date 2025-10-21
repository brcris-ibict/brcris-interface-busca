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
const INDEX_NAME = process.env.INDEX_PATENT || "";

const optDepositDate = new OptionsBar("Patents by deposit year");
const optPubDate = new OptionsBar("Patents by publication year");
const optCountryCode = new OptionsPie("Patents by country code");
const optKindCode = new OptionsPie("Patents by kind code");

const headersByDepositDate = [
  { label: "Deposit year", key: "key" },
  { label: "Quantity", key: "doc_count" },
];

const headersBypublicationDate = [
  { label: "Publication year", key: "key" },
  { label: "Quantity", key: "doc_count" },
];

const headersCountryCode = [
  { label: "Country code", key: "key" },
  { label: "Quantity", key: "doc_count" },
];
const headersKindCode = [
  { label: "Kind code", key: "key" },
  { label: "Quantity", key: "doc_count" },
];

function PatentsIndicators({
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
    optDepositDate.plugins.title.text = t(optDepositDate.title);
    optPubDate.plugins.title.text = t(optPubDate.title);
    optCountryCode.plugins.title.text = t(optCountryCode.title);
    optKindCode.plugins.title.text = t(optKindCode.title);

    const queries = [
      JSON.stringify(
        getAggregateQuery({
          size: 10,
          indicadorName: "depositDate",
          searchTerm: resultSearchTerm,
          fields,
          operator,
          filters,
          order: { _key: "desc" },
        }),
      ),
      JSON.stringify(
        getAggregateQuery({
          size: 10,
          indicadorName: "publicationDate",
          searchTerm: resultSearchTerm,
          fields,
          operator,
          filters,
          order: { _key: "desc" },
        }),
      ),
      JSON.stringify(
        getAggregateQuery({
          size: 10,
          indicadorName: "countryCode",
          searchTerm: resultSearchTerm,
          fields,
          operator,
          filters,
        }),
      ),
      JSON.stringify(
        getAggregateQuery({
          size: 10,
          indicadorName: "kindCode",
          searchTerm: resultSearchTerm,
          fields,
          operator,
          filters,
        }),
      ),
    ];
    if (isLoading) {
      indicatorProxyService.search(queries, INDEX_NAME).then((data) => {
        setIndicatorsData(data);
      });
    }
  }, [filters, resultSearchTerm, isLoading]);

  // deposite date
  const depositeDateIndicators: IndicatorType[] = indicators
    ? indicators[0]
    : [];
  const depositeDateLabels =
    depositeDateIndicators != null
      ? depositeDateIndicators.map((d) => d.key)
      : [];
  //  publication date
  const publicationDateIndicators: IndicatorType[] = indicators
    ? indicators[1]
    : [];
  const publicationDateLabels =
    publicationDateIndicators != null
      ? publicationDateIndicators.map((d) => d.key)
      : [];

  // country Code
  const countryCodeIndicators: IndicatorType[] = indicators
    ? indicators[2]
    : [];
  const countryCodeLabels =
    countryCodeIndicators != null
      ? countryCodeIndicators.map((d) => d.key)
      : [];
  const countryCodeCount =
    countryCodeIndicators != null
      ? countryCodeIndicators.map((d) => d.doc_count)
      : [];

  // kind Code
  const kindCodeIndicators: IndicatorType[] = indicators ? indicators[3] : [];
  const kindCodeLabels =
    kindCodeIndicators != null ? kindCodeIndicators.map((d) => d.key) : [];
  const kindCodeCount =
    kindCodeIndicators != null
      ? kindCodeIndicators.map((d) => d.doc_count)
      : [];

  depositeDateIndicators &&
    depositeDateIndicators.sort((a, b) => Number(a.key) - Number(b.key));
  publicationDateIndicators &&
    publicationDateIndicators.sort((a, b) => Number(a.key) - Number(b.key));

  return (
    <div className="indicators" hidden={isEmpty()}>
      <div className={styles.chart}>
        {/* @ts-ignore */}
        <CSVLink
          className={styles.download}
          title="Export to csv"
          data={depositeDateIndicators ? depositeDateIndicators : []}
          filename={"arquivo.csv"}
          headers={headersByDepositDate}
        >
          <Download />
        </CSVLink>
        <Bar
          /**
      // @ts-expect-error */
          options={optDepositDate}
          width="500"
          data={{
            labels: depositeDateLabels,
            datasets: [
              {
                data: depositeDateIndicators,
                label: "Articles per Year",
                backgroundColor: CHART_BACKGROUD_COLORS,
                borderColor: CHART_BORDER_COLORS,
                borderWidth: 1,
              },
            ],
          }}
        />
      </div>

      <div className={styles.chart} hidden={headersBypublicationDate == null}>
        {/* @ts-ignore */}
        <CSVLink
          className={styles.download}
          title="Export to csv"
          data={publicationDateIndicators ? publicationDateIndicators : []}
          filename={"arquivo.csv"}
          headers={headersByDepositDate}
        >
          <Download />
        </CSVLink>
        <Bar
          /**
      // @ts-expect-error */
          options={optPubDate}
          width="500"
          data={{
            labels: publicationDateLabels,
            datasets: [
              {
                data: publicationDateIndicators,
                label: "Articles per Year",
                backgroundColor: CHART_BACKGROUD_COLORS,
                borderColor: CHART_BORDER_COLORS,
                borderWidth: 1,
              },
            ],
          }}
        />
      </div>

      <div className={styles.chart} hidden={countryCodeIndicators == null}>
        {/* @ts-ignore */}
        <CSVLink
          className={styles.download}
          title={t("Export to csv") || ""}
          data={countryCodeIndicators ? countryCodeIndicators : []}
          filename={"arquivo.csv"}
          headers={headersCountryCode}
        >
          <Download />
        </CSVLink>
        <Pie
          /**
      // @ts-expect-error */
          options={optCountryCode}
          width="500"
          data={{
            labels: countryCodeLabels,
            datasets: [
              {
                data: countryCodeCount,
                label: "# of Votes",
                backgroundColor: CHART_BACKGROUD_COLORS,
                borderColor: CHART_BORDER_COLORS,
                borderWidth: 1,
              },
            ],
          }}
        />
      </div>

      <div className={styles.chart} hidden={kindCodeIndicators == null}>
        {/* @ts-ignore */}
        <CSVLink
          className={styles.download}
          title={t("Export to csv") || ""}
          data={kindCodeIndicators ? kindCodeIndicators : []}
          filename={"arquivo.csv"}
          headers={headersKindCode}
        >
          <Download />
        </CSVLink>
        <Pie
          /**
      // @ts-expect-error */
          options={optKindCode}
          width="500"
          data={{
            labels: kindCodeLabels,
            datasets: [
              {
                data: kindCodeCount,
                label: "# of codes",
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
}))(PatentsIndicators);
