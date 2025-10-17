/** biome-ignore-all lint/a11y/noAutofocus: <explanation> */
import { Search } from "lucide-react";
import type { GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useEffect, useRef, useState } from "react";
import { replaceSpacesWithHyphens } from "../../utils/Utils";
import AllIndexVisNetwork from "../components/AllIndexVisNetwork";
import indexes from "../configs/Indexes";
import { getIndexStats } from "../services/ElasticSearchStatsService";
import styles from "../styles/Home.module.css";

type Props = {
  // Add custom props here
};
// or getServerSideProps: GetServerSideProps<Props> = async ({ locale })
export const getStaticProps: GetStaticProps<Props> = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? "en", ["common", "navbar"])),
  },
});

export default function App() {
  // const [config, setConfig] = useState(configDefault)
  const router = useRouter();
  const { t } = useTranslation(["common"]);

  const partners = [
    {
      url: "https://www.gov.br/ibict/pt-br",
      path: "/logos/logo-ibict.png",
      description: "Logo do IBICT",
      // class: 'hilight',
    },
    {
      url: "http://www.finep.gov.br/",
      path: "/logos/finep.png",
      description: "Logo do Finep",
    },
    {
      url: "https://www.fap.df.gov.br/",
      path: "/logos/fapdf.png",
      description: "Logo do fapdf",
      class: "minus",
    },
    {
      url: "https://portal.fiocruz.br/",
      path: "/logos/fiocruz.png",
      description: "Logo da Fiocruz",
      // class: 'hilight',
    },
    {
      url: "https://www.gov.br/cnpq/pt-br",
      path: "/logos/cnpq.png",
      description: "Logo do CNPq",
    },
    {
      url: "https://www.fundep.ufmg.br/",
      path: "/logos/fundep.png",
      description: " Logo do FUNDEP",
      class: "minus",
    },
    {
      url: "https://www.lareferencia.info/pt/",
      path: "/logos/lareferencia.png",
      description: "Logo do LA Referencia",
      // class: 'hilight',
    },
  ];
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [term, setTerm] = useState("");
  const [docsCount, setDocsCount] = useState("");
  const [indexLabel, setIndexLabel] = useState(indexes[0].label);

  useEffect(() => {
    inputRef?.current?.focus();
    getIndexStats(indexLabel, setDocsCount);
  }, [indexLabel]);

  return (
    <>
      <Head>
        <title>{`BrCris - ${t("Home")}`}</title>
        <meta
          name="description"
          content={
            t(
              "The Brazilian Scientific Research Information Ecosystem, BrCris, is an aggregator platform that allows retrieving, certifying and visualizing data and information related to the various actors who work in scientific research in the Brazilian context.",
            ) || ""
          }
        />
      </Head>
      <div className={`container ${styles.home}`}>
        <div className="search-card">
          <h1>
            {t(
              "Search in the Brazilian Scientific Research Information Ecosystem",
            )}{" "}
            (BrCris)
          </h1>
          <form
            className="form-search"
            action={`/${router.locale}/${replaceSpacesWithHyphens(indexLabel.toLowerCase())}`}
          >
            <div className="form-group">
              <div className="custom-select">
                <select
                  id="index-select"
                  onChange={(e) => setIndexLabel(e.target.value)}
                  title={t("Select an entity") || ""}
                >
                  {indexes.map((index) => (
                    <option key={index.label} value={index.label}>
                      {t(index.label)}
                    </option>
                  ))}
                </select>
              </div>
              <input
                ref={inputRef}
                name="q"
                autoFocus
                title={`${t("Enter at least 3 characters and search among")} ${t(
                  "numberFormat",
                  {
                    value: docsCount,
                  },
                )} ${t(indexLabel)}`}
                type="search"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder={`${t("Enter at least 3 characters and search among")} ${t(
                  "numberFormat",
                  {
                    value: docsCount,
                  },
                )} ${t(indexLabel)}`}
              />
            </div>
            <button
              type="button"
              disabled={term?.trim().length < 3}
              className="btn btn-primary search-button"
              title={t("Search") || "Search"}
            >
              <Search /> {t("Search")}
            </button>
          </form>
        </div>
      </div>
      <section className={`container ${styles.informations}`}>
        <section className={styles.about}>
          <div className={styles.graph}>
            <AllIndexVisNetwork />
          </div>
          <div className={styles.info}>
            <h1>{t("BrCris")}</h1>
            <p className="card-text text-left">
              {t(
                "The Brazilian Scientific Research Information Ecosystem, BrCris, is an aggregator platform that allows retrieving, certifying and visualizing data and information related to the various actors who work in scientific research in the Brazilian context.",
              )}
            </p>
            <div className="text-right">
              <Link href="/about">{t("Learn more about BrCris")}</Link>
            </div>
          </div>
        </section>
        <section id="partners" className="container-fluid">
          <h2 className="text-center">{t("BrCris Partners")}</h2>
          <div className="partners">
            {partners.map((partner) => (
              <div key={partner.id} className={partner.class}>
                <a href={partner.url} target="_blank" rel="noreferrer">
                  <picture>
                    <img src={partner.path} alt={partner.description} />
                  </picture>
                </a>
              </div>
            ))}
          </div>
        </section>
      </section>
    </>
  );
}
