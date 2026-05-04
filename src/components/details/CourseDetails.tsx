/* eslint-disable @typescript-eslint/ban-ts-comment */
import { ErrorBoundary, useSearch } from "@elastic/react-search-ui";
import Head from "next/head";
import { useTranslation } from "next-i18next";
import type { OrgUnit } from "../../types/Entities";
import CopyLink from "../CopyLink";
import ShowItem from "../customResultView/ShowItem";
import ExpandableContent from "../ExpandableContent";
import Loader from "../Loader";
import ReportPopoverButton from "../ReportPopoverButton";

export default function CourseDetails() {
  const { wasSearched, isLoading, results } = useSearch();
  const { t } = useTranslation("common");

  return (
    <div className="">
      {isLoading && <Loader />}
      <ErrorBoundary>
        {wasSearched &&
          results &&
          results.length > 0 &&
          results.map((result) => (
            <div key={result.id?.raw}>
              <Head>
                <title>{`${result.name?.raw} | BrCris`}</title>
              </Head>

              <div className="mb-3 position-relative">
                <div className="d-flex justify-content-between align-items-center">
                  <h1 className="title mb-0">{result.name?.raw}</h1>
                </div>

                <div className="mt-2">
                  {result.id?.raw && (
                    <div className="d-flex align-items-center gap-2">
                      <img
                        className="brcris-logo"
                        src="/logos/brcris-grafo.jpeg"
                        alt="logo do BrCris"
                      />
                      <CopyLink
                        link={`${location.origin}/courses/${result.id.raw}`}
                      />
                      <ReportPopoverButton />
                    </div>
                  )}
                </div>
              </div>

              <div className="details-card">
                <ul>
                  <ShowItem label={t("Degree")} value={result.degree?.raw} />
                  <ShowItem label={t("Type")} value={result.type?.raw} />
                  <ShowItem
                    label={t("Start date")}
                    value={result.startDate?.raw}
                  />
                  <ShowItem label={t("End date")} value={result.endDate?.raw} />

                  {result.program && result.program.raw?.length > 0 && (
                    <li>
                      <span className="sui-result__key">{t("Program")}</span>
                      <span>
                        <ExpandableContent
                          items={
                            Array.isArray(result.program.raw)
                              ? result.program.raw
                              : [result.program.raw]
                          }
                          initialCount={3}
                          renderItem={(program: OrgUnit, idx: number) => (
                            <span key={idx}>
                              <a href={`/programs/${program.id}`}>
                                {program.name}
                              </a>
                            </span>
                          )}
                        />
                      </span>
                    </li>
                  )}

                  {result.orgUnit && result.orgUnit.raw?.length > 0 && (
                    <li>
                      <span className="sui-result__key">
                        {t("Organizational Unit")}
                      </span>
                      <span>
                        <ExpandableContent
                          items={
                            Array.isArray(result.orgUnit.raw)
                              ? result.orgUnit.raw
                              : [result.orgUnit.raw]
                          }
                          initialCount={3}
                          renderItem={(unit: OrgUnit, idx: number) => (
                            <span key={idx}>
                              <a href={`/organizations/${unit.id}`}>
                                {unit.name}
                              </a>
                            </span>
                          )}
                        />
                      </span>
                    </li>
                  )}
                  {result.publication?.raw?.length > 0 && (
                    <li>
                      <span className="sui-result__key">
                        {t("Publications")}
                      </span>
                      <ExpandableContent
                        items={result.publication?.raw}
                        initialCount={5}
                        renderItem={(publication: any) => (
                          <div className="publication-item">
                            <a href={`/publications/${publication?.id}`}>
                              {publication?.title}
                            </a>
                          </div>
                        )}
                      />
                    </li>
                  )}
                  {result.brcrisId?.raw?.length > 0 && (
                    <li>
                      <span className="sui-result__key">
                        {t("BrCris identifier")}
                      </span>
                      <span>
                        <ExpandableContent
                          items={
                            Array.isArray(result.brcrisId.raw)
                              ? result.brcrisId.raw
                              : [result.brcrisId.raw]
                          }
                          initialCount={5}
                          renderItem={(id: string, idx: number) => (
                            <span key={idx}>{id}</span>
                          )}
                        />
                      </span>
                    </li>
                  )}
                  {result.capesId?.raw?.length > 0 && (
                    <li>
                      <span className="identifier-key">
                        {t("Capes identifier")}:
                      </span>
                      <span>
                        <ExpandableContent
                          items={result.capesId.raw}
                          initialCount={5}
                          renderItem={(item: string) => <>{item}</>}
                        />
                      </span>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          ))}
      </ErrorBoundary>
    </div>
  );
}
