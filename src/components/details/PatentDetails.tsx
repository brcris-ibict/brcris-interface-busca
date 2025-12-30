import { ErrorBoundary, useSearch } from "@elastic/react-search-ui";
import Head from "next/head";
import { useTranslation } from "next-i18next";
import { useEffect, useState } from "react";

import type { OrgUnit } from "../../types/Entities";
import ShowAuthorItem from "../customResultView/ShowAuthorItem";
import ShowItem from "../customResultView/ShowItem";
import ExpandableContent from "../ExpandableContent";
import Loader from "../Loader";

import {
  fetchPatentInventors,
  Inventor,
  type PatentInventorsData,
} from "./PatentInventor";

export default function PatentDetails() {
  const { wasSearched, isLoading, results } = useSearch();
  const { t } = useTranslation("common");

  const [inventorsMap, setInventorsMap] = useState<
    Record<string, PatentInventorsData>
  >({});

  useEffect(() => {
    if (!results?.length) return;

    const loadInventors = async () => {
      const entries = await Promise.all(
        results.map(async (r) => {
          const patentId = r.id?.raw;
          if (!patentId) return null;

          const data = await fetchPatentInventors(patentId);
          return [patentId, data] as const;
        }),
      );

      const map: Record<string, PatentInventorsData> = {};
      entries.forEach((entry) => {
        if (entry) {
          map[entry[0]] = entry[1];
        }
      });

      setInventorsMap(map);
    };

    loadInventors();
  }, [results]);

  return (
    <div>
      {isLoading && <Loader />}

      <ErrorBoundary>
        {wasSearched &&
          results?.length > 0 &&
          results.map((result) => {
            const patentId = result.id?.raw;
            if (!patentId) return null;

            const inventors = inventorsMap[patentId];
            const inventorsFull = inventors?.inventorsFull ?? [];
            const inventorsPartial = inventors?.inventorsPartial ?? [];
            const inventorsCombined = [
              ...inventorsFull.map((i) => ({
                ...i,
                hasProfile: true,
              })),
              ...inventorsPartial.map((i) => ({
                ...i,
                hasProfile: false,
              })),
            ];

            return (
              <div key={patentId}>
                <Head>
                  <title>{`${result.title?.raw} | BrCris`}</title>
                </Head>

                <h1 className="title">{result.title?.raw}</h1>

                <div className="details-card">
                  <ul>
                    {inventorsCombined.length > 0 && (
                      <li>
                        <span className="sui-result__key">
                          {t("Inventor(s)")}
                        </span>

                        <ExpandableContent
                          items={inventorsCombined}
                          initialCount={5}
                          renderItem={(inventor: any, idx: number) => (
                            <span key={idx} className="sui-result__value">
                              {inventor.hasProfile ? (
                                <a href={`/people/${inventor.id}`}>
                                  {inventor.name.join("; ")}
                                </a>
                              ) : (
                                inventor.name.join("; ")
                              )}
                            </span>
                          )}
                        />
                      </li>
                    )}

                    {result.applicant?.raw && (
                      <li>
                        <span className="sui-result__key">
                          {t("Applicant")}
                        </span>
                        {result.applicant.raw.map((applicant: OrgUnit) => (
                          <span
                            key={applicant.id}
                            className="sui-result__value"
                          >
                            <a href={`/organizations${applicant.id}`}>
                              {applicant.name}
                            </a>
                          </span>
                        ))}
                      </li>
                    )}

                    <ShowItem
                      label={t("Deposit date")}
                      value={result.depositDate?.raw}
                    />
                    <ShowItem
                      label={t("Kind Code")}
                      value={result.kindCode?.raw}
                    />
                    <ShowItem
                      label={t("Country code")}
                      value={result.countryCode?.raw}
                    />
                    <ShowItem
                      label={t("Lattes Title")}
                      value={result.lattesTitle?.raw}
                    />
                    <ShowItem
                      label={t("Publication date")}
                      value={result.publicationDate?.raw}
                    />
                    <ShowItem
                      label={t("CPC Classification")}
                      value={result.CPCclassification?.raw}
                    />

                    {result.IPCclassification?.raw?.length > 0 && (
                      <li>
                        <span className="sui-result__key">
                          {t("IPC Classification")}
                        </span>
                        <ExpandableContent
                          items={result.IPCclassification.raw}
                          initialCount={5}
                          renderItem={(ipc: string, idx: number) => (
                            <span key={idx}>{ipc}</span>
                          )}
                        />
                      </li>
                    )}

                    {result.brcrisId?.raw?.length > 0 && (
                      <li>
                        <span className="sui-result__key">
                          {t("BrCris identifier")}
                        </span>
                        <ExpandableContent
                          items={result.brcrisId.raw}
                          initialCount={5}
                          renderItem={(id: string, idx: number) => (
                            <span key={idx}>{id}</span>
                          )}
                        />
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            );
          })}
      </ErrorBoundary>
    </div>
  );
}
