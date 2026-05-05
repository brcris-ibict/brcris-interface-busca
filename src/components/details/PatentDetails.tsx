import { ErrorBoundary, useSearch } from "@elastic/react-search-ui";
import Head from "next/head";
import { useTranslation } from "next-i18next";
import { capitalizeName } from "../../../utils/Utils";
import type { OrgUnit } from "../../types/Entities";
import CopyLink from "../CopyLink";
import ShowItem from "../customResultView/ShowItem";
import ExpandableContent from "../ExpandableContent";
import Loader from "../Loader";
import ReportPopoverButton from "../ReportPopoverButton";

export default function PatentDetails() {
  const { wasSearched, isLoading, results } = useSearch();
  const { t } = useTranslation("common");
  return (
    <div>
      {isLoading && <Loader />}

      <ErrorBoundary>
        {wasSearched &&
          results?.length > 0 &&
          results.map((result) => {
            const patentId = result.id?.raw;
            if (!patentId) return null;
            return (
              <div key={patentId}>
                <Head>
                  <title>{`${result.title?.raw} | BrCris`}</title>
                </Head>

                <div className="mb-3 position-relative">
                  <div className="d-flex justify-content-between align-items-center">
                    <h1 className="title mb-0">{result.title?.raw}</h1>
                  </div>

                  <div className="mt-2">
                    {result.id?.raw && (
                      <div className="d-flex align-items-center gap-2">
                        <img
                          className="brcris-logo"
                          src="/logos/brcris-grafo.svg"
                          alt="logo do BrCris"
                        />
                        <CopyLink
                          link={`${location.origin}/patents/${result.id.raw}`}
                        />
                        <ReportPopoverButton />
                      </div>
                    )}
                  </div>
                </div>
                <div className="details-card">
                  <ul>
                    {result.inventor?.raw && (
                      <li>
                        <span className="sui-result__key">
                          {t("Inventor(s)")}
                        </span>

                        <ExpandableContent
                          items={result.inventor?.raw ?? []}
                          initialCount={5}
                          renderItem={(inventor: any, idx: number) => {
                            const sameAsPatent = inventor.id === patentId;
                            const name = inventor.name
                              .map(capitalizeName)
                              .join("; ");

                            return (
                              <span key={idx} className="sui-result__value">
                                {sameAsPatent ? (
                                  name
                                ) : (
                                  <a href={`/people/${inventor.id}`}>{name}</a>
                                )}
                              </span>
                            );
                          }}
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
                            <a href={`/organizations/${applicant.id}`}>
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
