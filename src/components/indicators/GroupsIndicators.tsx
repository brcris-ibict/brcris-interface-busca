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
const INDEX_NAME = process.env.INDEX_GROUP || "";

const headersByCreationYear = [
  { label: "Creation year", key: "key" },
  { label: "Quantity", key: "doc_count" },
];

const headersResearchLine = [
  { label: "Research line", key: "key" },
  { label: "Quantity", key: "doc_count" },
];
const headersKnowledgeArea = [
  { label: "Knowledge Area", key: "key" },
  { label: "Quantity", key: "doc_count" },
];
const headersStatus = [
  { label: "Status", key: "key" },
  { label: "Quantity", key: "doc_count" },
];

function GroupsIndicators({
  filters,
  resultSearchTerm,
  isLoading,
}: IndicatorsProps) {
  const { t } = useTranslation("common");
  const optResearchLine = new OptionsPie(t("Research groups by Research line"));
  const optKnowledgeArea = new OptionsPie(
    t("Research groups by knowledge area"),
  );
  const optStatus = new OptionsPie(t("Research groups by status"));
  const optCreatYear = new OptionsBar(t("Research groups by creation year"));

  const { driver } = useContext(SearchContext);
  const { indicators, setIndicatorsData, isEmpty } =
    useContext(IndicatorContext);
  const { search_fields, operator } = driver.searchQuery as CustomSearchQuery;
  const normalizedOperator = operator?.toUpperCase() === "OR" ? "OR" : "AND";
  // @ts-expect-error
  const fields = Object.keys(search_fields);

  useEffect(() => {
    // tradução
    if (!optCreatYear.plugins) optCreatYear.plugins = {};
    if (!optCreatYear.plugins.title)
      optCreatYear.plugins.title = { display: true, text: "" };
    optCreatYear.plugins.title.text = t(optCreatYear.title);
    const queries = [
      JSON.stringify(
        getAggregateQuery({
          size: 10,
          indicadorName: "creationYear",
          searchTerm: resultSearchTerm,
          fields,
          operator: normalizedOperator,
          filters,
          order: { _key: "desc" },
        }),
      ),
      JSON.stringify(
        getAggregateQuery({
          size: 10,
          indicadorName: "researchLine",
          searchTerm: resultSearchTerm,
          fields,
          operator: normalizedOperator,
          filters,
        }),
      ),
      JSON.stringify(
        getAggregateQuery({
          size: 10,
          indicadorName: "knowledgeArea",
          searchTerm: resultSearchTerm,
          fields,
          operator: normalizedOperator,
          filters,
        }),
      ),
      JSON.stringify(
        getAggregateQuery({
          size: 10,
          indicadorName: "status",
          searchTerm: resultSearchTerm,
          fields,
          operator: normalizedOperator,
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

  // creation year
  const creationYearIndicators: IndicatorType[] = indicators
    ? indicators[0]
    : [];
  const creationYearLabels =
    creationYearIndicators != null
      ? creationYearIndicators.map((d) => d.key)
      : [];

  // research line
  const researchLineIndicators: IndicatorType[] = indicators
    ? indicators[1]
    : [];
  const researchLineLabels =
    researchLineIndicators != null
      ? researchLineIndicators.map((d) => d.key)
      : [];
  const researchLineCount =
    researchLineIndicators != null
      ? researchLineIndicators.map((d) => d.doc_count)
      : [];

  // knowledge area
  const knowledgeAreaIndicators: IndicatorType[] = indicators
    ? indicators[2]
    : [];
  const knowledgeAreaLabels =
    knowledgeAreaIndicators != null
      ? knowledgeAreaIndicators.map((d) => d.key)
      : [];
  const knowledgeAreaCount =
    knowledgeAreaIndicators != null
      ? knowledgeAreaIndicators.map((d) => d.doc_count)
      : [];

  // status
  const statusIndicators: IndicatorType[] = indicators ? indicators[3] : [];
  const statusLabels =
    statusIndicators != null ? statusIndicators.map((d) => d.key) : [];
  const statusCount =
    statusIndicators != null ? statusIndicators.map((d) => d.doc_count) : [];

  creationYearIndicators &&
    creationYearIndicators.sort((a, b) => Number(a.key) - Number(b.key));

  return (
    <div className="indicators" hidden={isEmpty()}>
      <div className={styles.chart} hidden={creationYearIndicators == null}>
        {/* @ts-ignore */}
        <CSVLink
          className={styles.download}
          title="Export to csv"
          data={creationYearIndicators ? creationYearIndicators : []}
          filename={"arquivo.csv"}
          headers={headersByCreationYear}
        >
          <Download />
        </CSVLink>
        <Bar
          options={optCreatYear}
          width="500"
          data={{
            labels: creationYearLabels,
            datasets: [
              {
                data: creationYearIndicators,
                label: t("Groups by Year"),
                backgroundColor: CHART_BACKGROUD_COLORS,
                borderColor: CHART_BORDER_COLORS,
                borderWidth: 1,
              },
            ],
          }}
        />
      </div>

      <div className={styles.chart} hidden={researchLineIndicators == null}>
        {/* @ts-ignore */}
        <CSVLink
          className={styles.download}
          title={t("Export to csv") || ""}
          data={researchLineIndicators ? researchLineIndicators : []}
          filename={"arquivo.csv"}
          headers={headersResearchLine}
        >
          <Download />
        </CSVLink>
        <Pie
          options={optResearchLine}
          width="500"
          data={{
            labels: researchLineLabels,
            datasets: [
              {
                data: researchLineCount,
                label: "# of Votes",
                backgroundColor: CHART_BACKGROUD_COLORS,
                borderColor: CHART_BORDER_COLORS,
                borderWidth: 1,
              },
            ],
          }}
        />
      </div>

      <div className={styles.chart} hidden={knowledgeAreaIndicators == null}>
        {/* @ts-ignore */}
        <CSVLink
          className={styles.download}
          title={t("Export to csv") || ""}
          data={knowledgeAreaIndicators ? knowledgeAreaIndicators : []}
          filename={"arquivo.csv"}
          headers={headersKnowledgeArea}
        >
          <Download />
        </CSVLink>
        <Pie
          options={optKnowledgeArea}
          width="500"
          data={{
            labels: knowledgeAreaLabels,
            datasets: [
              {
                data: knowledgeAreaCount,
                label: "# of codes",
                backgroundColor: CHART_BACKGROUD_COLORS,
                borderColor: CHART_BORDER_COLORS,
                borderWidth: 1,
              },
            ],
          }}
        />
      </div>

      <div className={styles.chart} hidden={statusIndicators == null}>
        {/* @ts-ignore */}
        <CSVLink
          className={styles.download}
          title={t("Export to csv") || ""}
          data={knowledgeAreaIndicators ? knowledgeAreaIndicators : []}
          filename={"arquivo.csv"}
          headers={headersStatus}
        >
          <Download />
        </CSVLink>
        <Pie
          options={optStatus}
          width="500"
          data={{
            labels: statusLabels,
            datasets: [
              {
                data: statusCount,
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
}))(GroupsIndicators);
