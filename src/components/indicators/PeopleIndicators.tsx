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
import { Pie } from "react-chartjs-2";
import { CSVLink } from "react-csv";
import { TagCloud } from "react-tagcloud";
import {
  CHART_BACKGROUD_COLORS,
  CHART_BORDER_COLORS,
} from "../../../utils/Utils";
import indicatorProxy from "../../services/IndicatorProxyService";
import styles from "../../styles/Indicators.module.css";
import type { CustomSearchQuery, IndicatorType } from "../../types/Entities";
import type { IndicatorsProps } from "../../types/Propos";
import IndicatorContext from "../context/CustomContext";
import { OptionsPie } from "./options/ChartsOptions";
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
const INDEX_NAME = process.env.INDEX_PERSON || "";

const headersNacionality = [
  { label: "Nacionality", key: "key" },
  { label: "Quantity", key: "doc_count" },
];

const headersResearchArea = [
  { label: "Affiliation", key: "key" },
  { label: "Quantity", key: "doc_count" },
];

function PeopleIndicators({ filters, resultSearchTerm }: IndicatorsProps) {
  const { t } = useTranslation("common");
  const { driver } = useContext(SearchContext);
  const { indicators, setIndicatorsData, isEmpty } =
    useContext(IndicatorContext);

  const { search_fields, operator } = driver.searchQuery as CustomSearchQuery;
  const normalizedOperator = operator?.toUpperCase() === "OR" ? "OR" : "AND";
  // @ts-expect-error
  const fields = Object.keys(search_fields);
  const optionsResearchArea = new OptionsPie(t("Affiliation"));

  useEffect(() => {
    const plugins = {
      ...optionsResearchArea.plugins,
      title: {
        display: true,
        text: t(optionsResearchArea.title),
        ...(optionsResearchArea.plugins?.title ?? {}),
      },
    };

    optionsResearchArea.plugins = plugins;
    try {
      const queries = [
        JSON.stringify(
          getAggregateQuery({
            size: 10,
            indicadorName: "nationality",
            searchTerm: resultSearchTerm,
            fields,
            operator: normalizedOperator,
            filters,
          }),
        ),
        JSON.stringify(
          getAggregateQuery({
            size: 10,
            indicadorName: "affiliation.name",
            searchTerm: resultSearchTerm,
            fields,
            operator: normalizedOperator,
            filters,
          }),
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
    nationalities != null
      ? nationalities.map((d) => ({ value: d.key, count: d.doc_count }))
      : [];

  const researchArea: IndicatorType[] = indicators ? indicators[1] : [];

  const researchAreaLabels =
    researchArea != null ? researchArea.map((d) => d.key) : [];

  const researchAreaValues =
    researchArea != null ? researchArea.map((d) => d.doc_count) : [];

  return (
    <div className="indicators" hidden={isEmpty()}>
      <div className={styles.chart}>
        {/* @ts-ignore */}
        <CSVLink
          className={styles.download}
          title="Export to csv"
          data={researchArea ? researchArea : []}
          filename={"arquivo.csv"}
          headers={headersResearchArea}
        >
          <Download />
        </CSVLink>
        <Pie
          options={optionsResearchArea}
          data={{
            labels: researchAreaLabels,
            datasets: [
              {
                data: researchAreaValues,
                label: "# People",
                backgroundColor: CHART_BACKGROUD_COLORS,
                borderColor: CHART_BORDER_COLORS,
                borderWidth: 1,
              },
            ],
          }}
        />
      </div>

      <div
        className={styles.chart}
        hidden={nationalities == null || nationalities.length === 0}
      >
        <p
          style={{
            display:
              nationalities && nationalities.length > 0 ? "block" : "none",
          }}
          className={styles.title}
        >
          {t("Nationalities")}
        </p>
        {/* @ts-ignore */}
        <CSVLink
          className={styles.download}
          title="Exportar para csv"
          data={nationalities ? nationalities : []}
          filename={"arquivo.csv"}
          headers={headersNacionality}
        >
          <Download />
        </CSVLink>
        <TagCloud
          minSize={12}
          maxSize={35}
          tags={nationalitiesTagsCloud}
          // @ts-expect-error
          style={{
            width: 300,
            textAlign: "center",
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
export default withSearch(({ filters, resultSearchTerm }) => ({
  filters,
  resultSearchTerm,
}))(PeopleIndicators);
