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
import { Bar } from "react-chartjs-2";
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
const INDEX_NAME = process.env.INDEX_PROGRAM || "";

const headersOrgUnit = [
  { label: "Organization", key: "key" },
  { label: "Quantity", key: "doc_count" },
];

function ProgramsIndicators({
  filters,
  resultSearchTerm,
  isLoading,
}: IndicatorsProps) {
  const { t } = useTranslation("common");
  const options = new OptionsBar(t("Program by OrgUnit"));

  const { driver } = useContext(SearchContext);
  const { indicators, setIndicatorsData, isEmpty } =
    useContext(IndicatorContext);
  const { search_fields, operator } = driver.searchQuery as CustomSearchQuery;

  // @ts-expect-error
  const fields = Object.keys(search_fields);

  useEffect(() => {
    // Garantir que plugins e plugins.title existam antes de usar
    options.plugins = {
      ...options.plugins,
      title: {
        display: true,
        text: t(options.title),
        ...(options.plugins?.title ?? {}),
      },
    };

    const queries = [
      JSON.stringify(
        getAggregateQuery({
          size: 10,
          indicadorName: "orgunit.acronym",
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
  }, [filters, resultSearchTerm, isLoading, t, fields]);

  const orgUnitIndicators: IndicatorType[] = indicators ? indicators[0] : [];
  const orgUnitLabels =
    orgUnitIndicators != null ? orgUnitIndicators.map((d) => d.key) : [];

  return (
    <div className="indicators" hidden={isEmpty()}>
      <div className={styles.chart}>
        {/* @ts-ignore */}
        <CSVLink
          className={styles.download}
          title="Export to csv"
          data={orgUnitIndicators ? orgUnitIndicators : []}
          filename={"arquivo.csv"}
          headers={headersOrgUnit}
        >
          <Download />
        </CSVLink>
        <Bar
          options={options}
          width="500"
          data={{
            labels: orgUnitLabels,
            datasets: [
              {
                data: orgUnitIndicators,
                label: t("Programs") || "",
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
}))(ProgramsIndicators);
