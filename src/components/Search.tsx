/* eslint-disable @typescript-eslint/ban-ts-comment */
/** biome-ignore-all lint/suspicious/noArrayIndexKey: explanation */
/** biome-ignore-all lint/correctness/useExhaustiveDependencies: explanation */

import {
  ErrorBoundary,
  Facet,
  Paging,
  PagingInfo,
  Results,
  ResultsPerPage,
  Sorting,
  WithSearch,
} from "@elastic/react-search-ui";
import { Layout } from "@elastic/react-search-ui-views";
import "@elastic/react-search-ui-views/lib/styles/styles.css";
import { Maximize2, Minimize2 } from "lucide-react";
import type { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useCallback, useState } from "react";
import { containsResults, replaceSpacesWithHyphens } from "../../utils/Utils";
import styles from "../styles/Home.module.css";
import type { Index } from "../types/Propos";
import CustomSearchBox from "./CustomSearchBox";
import CustomViewPagingInfo from "./customResultView/CustomViewPagingInfo";
import DownloadModal from "./DownloadModal";
import Loader from "./Loader";

export const getServerSideProps: GetServerSideProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? "en", [
      "common",
      "navbar",
      "advanced",
      "facets",
    ])),
  },
});

export type SearchProps = {
  index: Index;
};

export default function Search({ index }: SearchProps) {
  const { t } = useTranslation(["common", "facets"]);
  const router = useRouter();

  const handleSelectIndex = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const params = new URLSearchParams(window.location.search);
      router.push(
        `/${replaceSpacesWithHyphens(event.target.value.toLowerCase())}?${params.toString()}`,
      );
    },
    [],
  );

  const typeArqw = "ris";
  const [isFluid, setIsFluid] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsFluid(!isFluid)}
        style={{
          border: "1px solid var(--border-color)",
          background: "#fff",
          float: "right",
        }}
        aria-label="Toggle container width"
      >
        {isFluid ? <Minimize2 /> : <Maximize2 size={20} />}
      </button>
      <div className={`${isFluid ? "container-fluid" : "container"}`}>
        <WithSearch
          mapContextToProps={({
            wasSearched,
            results,
            isLoading,
            setSearchTerm,
            resultSearchTerm,
          }) => ({
            wasSearched,
            results,
            isLoading,
            setSearchTerm,
            resultSearchTerm,
          })}
        >
          {({
            wasSearched,
            results,
            isLoading,
            setSearchTerm,
            resultSearchTerm,
          }) => {
            return (
              <div className="App">
                <div className="container page">
                  <div className="page-title">
                    <h1>{t(index.label)}</h1>
                  </div>
                </div>
                <div className={styles.content}>
                  <div className={styles.searchLayout}>
                    {isLoading ? <Loader /> : ""}
                    <Layout
                      header={
                        <CustomSearchBox
                          titleFieldName="title"
                          setSearchTerm={setSearchTerm!}
                          handleSelectIndex={handleSelectIndex}
                          indexLabel={index.label}
                          fieldNames={Object.keys(
                            index.config.searchQuery.search_fields as object,
                          ).concat(
                            Object.keys(
                              index.config.searchQuery.advanced_fields ||
                                ([] as object),
                            ),
                          )}
                        />
                      }
                      bodyContent={
                        <ErrorBoundary
                          className={styles.searchError}
                          view={({ className, error }) => (
                            <>
                              {error && (
                                <p className={`sui-search-error ${className}`}>
                                  {t(error.trim())}
                                </p>
                              )}
                              {!error &&
                                wasSearched &&
                                results?.length === 0 &&
                                resultSearchTerm && (
                                  <strong>
                                    {t(
                                      "No documents were found for your search",
                                    )}
                                  </strong>
                                )}
                              {!error &&
                                containsResults(wasSearched, results) && (
                                  <>
                                    <div className="sui-layout-sidebar">
                                      <Sorting
                                        label={t("Sort by") || ""}
                                        sortOptions={index.sortOptions}
                                      />
                                      {/* <div className="filters">
                                        <span className="sui-sorting__label">{t('Filters')}</span>
                                      </div> */}
                                      {Object.keys(
                                        index.config.searchQuery.facets!,
                                      ).map((facet, i) => (
                                        <Facet
                                          className={`facet-${facet}`}
                                          key={i}
                                          field={facet}
                                          label={t(facet.toLowerCase(), {
                                            ns: "facets",
                                          })}
                                        />
                                      ))}
                                    </div>
                                    <div className="result">
                                      <Results resultView={index.customView} />{" "}
                                      <Paging />
                                    </div>
                                    <index.indicators />
                                  </>
                                )}
                            </>
                          )}
                        ></ErrorBoundary>
                      }
                      bodyHeader={
                        <ErrorBoundary className={styles.searchErrorHidden}>
                          {containsResults(wasSearched, results) && (
                            <div className="d-flex align-items-center">
                              <PagingInfo view={CustomViewPagingInfo} />
                            </div>
                          )}

                          {containsResults(wasSearched, results) && (
                            <div className="d-flex gap-2  align-items-center">
                              {
                                <>
                                  <ResultsPerPage options={[10, 20, 50]} />
                                  {/* @ts-ignore */}
                                  <DownloadModal typeArq={typeArqw} />
                                  <DownloadModal />{" "}
                                </>
                              }
                            </div>
                          )}
                        </ErrorBoundary>
                      }
                      // bodyFooter={}
                    />
                  </div>
                </div>
              </div>
            );
          }}
        </WithSearch>
      </div>
    </>
  );
}
