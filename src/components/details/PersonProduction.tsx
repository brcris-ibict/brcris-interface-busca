/* eslint-disable react-hooks/exhaustive-deps */

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
import { Download, GraduationCap, Users } from "lucide-react";
import { useTranslation } from "next-i18next";
import { useEffect, useState } from "react";
import { Bar, Pie } from "react-chartjs-2";
import { CSVLink } from "react-csv";
import { fetchAuthorData } from "../../services/authorHelpers";
import styles from "../../styles/Indicators.module.css";
import type { IndicatorType } from "../../types/Entities";
import { OptionsBar, OptionsPie } from "../indicators/options/ChartsOptions";
import PopoverButton from "../PopOver";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
);

export const options = new OptionsBar("Publications by year");
export const optionsType = new OptionsPie("Publications by type");

const headersPublicationsByYear = [
  { label: "Year", key: "key" },
  { label: "Quantity", key: "doc_count" },
];

const headersType = [
  { label: "Type", key: "key" },
  { label: "Quantity", key: "doc_count" },
];
function aggregateByField(items: any[], field: string): IndicatorType[] {
  return Object.values(
    items.reduce((acc: any, item: any) => {
      const rawKey = item[field];
      const key = Array.isArray(rawKey) ? rawKey[0] : rawKey;

      if (!key) return acc;

      if (!acc[key]) {
        acc[key] = { key, doc_count: 0 };
      }

      acc[key].doc_count += 1;
      return acc;
    }, {}),
  );
}

export default function PersonProduction({
  publications,
  authorId,
}: {
  publications?: any[];
  authorId: any;
}) {
  const { t } = useTranslation("common");

  if (options.plugins?.title) {
    options.plugins.title.text = t(options.title);
  }

  if (optionsType.plugins?.title) {
    optionsType.plugins.title.text = t(optionsType.title);
  }

  const TYPE_COLORS: Record<string, string> = {
    Artigo: "#D9D2FF",
    "Artigo de Conferência": "#FFD6E7",
    "Capítulo de Livro": "#CFE7FF",
    Livro: "#D7F5E3",
    Dissertação: "#FFF0C2",
    Tese: "#FFE3C8",
    "Conjunto de Dados": "#CFF5F6",
    Preprint: "#E3E7F0",
  };

  const TYPE_BORDER_COLORS: Record<string, string> = {
    Artigo: "#B8A9FF",
    "Artigo de Conferência": "#FF9FC5",
    "Capítulo de Livro": "#9FD0FF",
    Livro: "#9FE3C5",
    Dissertação: "#FFD976",
    Tese: "#FFC49C",
    "Conjunto de Dados": "#8EE3E6",
    Preprint: "#B5C0D6",
  };

  const publicationTypeMap: Record<string, string> = {
    Artigo: t("Journal article"),
    "Artigo de Conferência": t("Conference paper"),
    "Capítulo de Livro": t("Book chapter"),
    Livro: t("Book"),
    Dissertação: t("Dissertation"),
    Tese: t("Thesis"),
    "Conjunto de Dados": t("Dataset"),
    Preprint: t("Preprint"),
  };
  const publicationsByYearAndType: Record<string, Record<string, number>> = {};

  publications?.forEach((pub) => {
    const year = pub.publicationDate;
    const type = Array.isArray(pub.type) ? pub.type[0] : pub.type;

    if (!year || !type) return;

    if (!publicationsByYearAndType[year]) {
      publicationsByYearAndType[year] = {};
    }

    if (!publicationsByYearAndType[year][type]) {
      publicationsByYearAndType[year][type] = 0;
    }

    publicationsByYearAndType[year][type] += 1;
  });

  const years = Object.keys(publicationsByYearAndType).sort(
    (a, b) => Number(a) - Number(b),
  );

  const allTypes = Array.from(
    new Set(
      publications?.map((p) => (Array.isArray(p.type) ? p.type[0] : p.type)),
    ),
  );

  const datasets = allTypes.map((type) => ({
    label: publicationTypeMap[type] || type,
    data: years.map((year) => publicationsByYearAndType[year]?.[type] || 0),
    backgroundColor: TYPE_COLORS[type] || "#d9d9d9",
    borderColor: TYPE_BORDER_COLORS[type] || "#999999",
    borderWidth: 1,
  }));

  const typeIndicators: IndicatorType[] = aggregateByField(
    publications
      ?.filter((p) => p.type)
      .map((p) => ({
        ...p,
        type: Array.isArray(p.type) ? p.type[0] : p.type,
      })) || [],
    "type",
  );

  const typeLabels = typeIndicators.map((d) => d.key);
  const translatedTypeLabels = typeLabels.map(
    (type) => publicationTypeMap[type] || type,
  );
  const typeDoc_count = typeIndicators.map((d) => d.doc_count);
  const CSVLinkFix = CSVLink as any;
  // biome-ignore lint/correctness/useHookAtTopLevel: <explanation>
  const [authorData, setAuthorData] = useState<{
    coauthors: any[];
    hasCoauthors: boolean;
    advisees: any[];
    hasAdvisees: boolean;
  }>({
    coauthors: [],
    hasCoauthors: false,
    advisees: [],
    hasAdvisees: false,
  });

  useEffect(() => {
    fetchAuthorData(authorId).then(setAuthorData);
  }, [authorId]);
  const hasPublications = (publications ?? []).length > 0;
  const hasNetworks = authorData.hasCoauthors || authorData.hasAdvisees;
  if (!hasPublications) {
    return (
      <div className="indicators">
        <PopoverButton className="position-absolute" />
      </div>
    );
  }
  if (!hasNetworks) {
    return (
      <div className="indicators">
        <PopoverButton className="position-absolute" />
      </div>
    );
  }
  return (
    <div className="indicators">
      <PopoverButton className="position-absolute" />

      <h3 className="title-indicators">
        {t("Publication and advising indicators")}
      </h3>
      {authorData.hasCoauthors && (
        <div className="card p-2 mb-3">
          <a href="#coautoria">
            <Users /> {t("Co-authorship Network")}
          </a>
        </div>
      )}
      {authorData.hasAdvisees && (
        <div className="card p-2 mb-3">
          <a href="#orientacoes">
            <GraduationCap /> {t("Advising Network")}
          </a>
        </div>
      )}

      <div className={styles.chart}>
        <CSVLinkFix
          className={styles.download}
          title="Export to csv"
          data={years.map((year) => ({
            key: year,
            doc_count: Object.values(publicationsByYearAndType[year]).reduce(
              (a, b) => a + b,
              0,
            ),
          }))}
          filename={"publications_by_year.csv"}
          headers={headersPublicationsByYear}
        >
          <Download />
        </CSVLinkFix>
        <Bar
          options={options}
          data={{
            labels: years,
            datasets: datasets,
          }}
        />
      </div>

      <div className={styles.chart}>
        <CSVLinkFix
          className={styles.download}
          title={t("Export to csv") || ""}
          data={typeIndicators}
          filename={"publications_by_type.csv"}
          headers={headersType}
        >
          <Download />
        </CSVLinkFix>
        <Pie
          options={optionsType}
          data={{
            labels: translatedTypeLabels,
            datasets: [
              {
                data: typeDoc_count,
                backgroundColor: typeLabels.map(
                  (type) => TYPE_COLORS[type] || "#d9d9d9",
                ),
                borderColor: typeLabels.map(
                  (type) => TYPE_BORDER_COLORS[type] || "#999999",
                ),
                borderWidth: 1,
              },
            ],
          }}
        />
      </div>
    </div>
  );
}
