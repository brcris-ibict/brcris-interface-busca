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
import { useContext, useEffect, useMemo, useRef } from "react";
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
}: IndicatorsProps) {
  const { t } = useTranslation("common");
  const { driver } = useContext(SearchContext);
  const { indicators, setIndicatorsData, isEmpty } =
    useContext(IndicatorContext);

  const { search_fields, operator } = driver.searchQuery as CustomSearchQuery;

  const normalizedOperator = operator?.toUpperCase() === "OR" ? "OR" : "AND";

  // stable fields
  const fields = useMemo(
    () => Object.keys(search_fields ?? {}),
    [search_fields],
  );

  // stable query key
  const queryKey = useMemo(
    () =>
      JSON.stringify({
        filters,
        resultSearchTerm,
      }),
    [filters, resultSearchTerm],
  );

  const prevQueryRef = useRef<string | null>(null);

  // stable chart options (with translation)
  const barOptions = useMemo(() => {
    const opt = new OptionsBar("Publicatons by year");
    if (!opt.plugins) opt.plugins = {};
    if (!opt.plugins.title) opt.plugins.title = { display: true, text: "" };
    opt.plugins.title.text = t(opt.title);
    return opt;
  }, [t]);

  const pieOptions = useMemo(() => {
    const opt = new OptionsPie("Publicatons by type");
    if (!opt.plugins) opt.plugins = {};
    if (!opt.plugins.title) opt.plugins.title = { display: true, text: "" };
    opt.plugins.title.text = t(opt.title);
    return opt;
  }, [t]);

  useEffect(() => {
    if (!resultSearchTerm) return;

    if (prevQueryRef.current === queryKey) return;
    prevQueryRef.current = queryKey;

    let cancelled = false;

    try {
      const pdQuery = JSON.stringify(
        getAggregateQuery({
          size: 10,
          indicadorName: "publicationDate",
          searchTerm: resultSearchTerm,
          fields,
          operator: normalizedOperator,
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
          operator: normalizedOperator,
          filters,
        }),
      );

      indicatorProxyService
        .search([pdQuery, typeQuery], INDEX_NAME)
        .then((data) => {
          if (!cancelled) {
            setIndicatorsData(data);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setIndicatorsData([]);
          }
        });
    } catch (err) {
      console.error(err);
      if (!cancelled) setIndicatorsData([]);
    }

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey, fields, normalizedOperator, resultSearchTerm, filters]);

  // ----------- DATA PROCESSING -----------

  const yearIndicators: IndicatorType[] = useMemo(
    () => indicators?.[0] ?? [],
    [indicators],
  );
  const typeIndicators: IndicatorType[] = useMemo(
    () => indicators?.[1] ?? [],
    [indicators],
  );

  const sortedYearIndicators = useMemo(() => {
    return [...yearIndicators].sort((a, b) => Number(a.key) - Number(b.key));
  }, [yearIndicators]);

  const yearLabels = useMemo(
    () => sortedYearIndicators.map((d) => d.key),
    [sortedYearIndicators],
  );

  const typeLabels = useMemo(
    () => typeIndicators.map((d) => d.key),
    [typeIndicators],
  );

  const typeDocCount = useMemo(
    () => typeIndicators.map((d) => d.doc_count),
    [typeIndicators],
  );

  // ----------- CHART DATA (MEMOIZED) -----------

  const barData = useMemo(
    () => ({
      labels: yearLabels,
      datasets: [
        {
          data: sortedYearIndicators.map((d) => d.doc_count),
          label: t("Articles per Year"),
          backgroundColor: CHART_BACKGROUD_COLORS,
          borderColor: CHART_BORDER_COLORS,
          borderWidth: 1,
        },
      ],
    }),
    [yearLabels, sortedYearIndicators, t],
  );

  const pieData = useMemo(
    () => ({
      labels: typeLabels,
      datasets: [
        {
          data: typeDocCount,
          label: t("Types"),
          backgroundColor: CHART_BACKGROUD_COLORS,
          borderColor: CHART_BORDER_COLORS,
          borderWidth: 1,
        },
      ],
    }),
    [typeLabels, typeDocCount, t],
  );

  // ----------- RENDER -----------

  if (isEmpty()) return null;

  return (
    <div className="indicators">
      <PopoverButton className="position-absolute" />

      <div className={styles.chart}>
        <CSVLink
          className={styles.download}
          title="Export to csv"
          data={sortedYearIndicators}
          filename="publications-by-year.csv"
          headers={headersPublicationsByYear}
        >
          <Download />
        </CSVLink>

        <Bar options={barOptions} data={barData} />
      </div>

      <div className={styles.chart}>
        <CSVLink
          className={styles.download}
          title={t("Export to csv") || ""}
          data={typeIndicators}
          filename="publications-by-type.csv"
          headers={headersType}
        >
          <Download />
        </CSVLink>

        <Pie options={pieOptions} data={pieData} />
      </div>
    </div>
  );
}

export default withSearch(({ filters, resultSearchTerm }) => ({
  filters,
  resultSearchTerm,
}))(PublicationsIndicators);
