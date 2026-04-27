import { ErrorBoundary, useSearch } from "@elastic/react-search-ui";
import Head from "next/head";
import { useTranslation } from "next-i18next";
import type { OrgUnit } from "../../types/Entities";
import CopyLink from "../CopyLink";
import ShowItem from "../customResultView/ShowItem";
import ExpandableContent from "../ExpandableContent";
import Loader from "../Loader";
export default function ProgramDetails() {
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
            <div key={result.id}>
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
                        src="/logos/logo-brcris.png"
                        alt="logo do BrCris"
                      />
                      <CopyLink
                        link={`${location.origin}/programs/${result.id.raw}`}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="details-card">
                <ul>
                  {result.orgUnit?.raw?.length > 0 && (
                    <li>
                      <span className="sui-result__key">
                        {t("Organization")}
                      </span>
                      <span className="sui-result__value">
                        {result.orgUnit?.raw.map((org: OrgUnit) => (
                          <a key={org.id} href={`/organizations/${org.id}`}>
                            {org.name!}
                          </a>
                        ))}
                      </span>
                    </li>
                  )}
                  <ShowItem
                    label={t("Research field")}
                    value={result.researchArea?.raw.map((researchArea: any) => (
                      <span key={researchArea.id}>{researchArea.name}</span>
                    ))}
                  />
                  <ShowItem
                    label={t("Evaluation area")}
                    value={result.evaluationArea?.raw}
                  />
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
                  {result.course?.raw?.length > 0 && (
                    <li>
                      <strong className="research-title">{t("Course")}</strong>
                      <ExpandableContent
                        items={result.course.raw}
                        initialCount={5}
                        renderItem={(course: any) => {
                          const name = course.name?.[0] ?? course.name;
                          const degree = course.degree?.[0];

                          return (
                            <div className="course-item" key={course.id}>
                              <a href={`/courses/${course.id}`}>{name}</a>
                              <div className="course-meta">
                                <span className="type">{t(degree)}</span>
                              </div>
                            </div>
                          );
                        }}
                      />
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
