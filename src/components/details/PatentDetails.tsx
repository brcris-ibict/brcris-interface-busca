import { useSearch } from "@elastic/react-search-ui";
import Head from "next/head";
import { useTranslation } from "next-i18next";
import { normalizeText } from "../../../utils/Utils";
import { withBasePath } from "../../lib/basePath";
import NotFound from "../../pages/404";
import type { OrgUnit } from "../../types/Entities";
import CopyLink from "../CopyLink";
import ShowItem from "../customResultView/ShowItem";
import DataUpdateModal from "../DataUpdateModal";
import ExpandableContent from "../ExpandableContent";
import Loader from "../Loader";
import ReportPopoverButton from "../ReportPopoverButton";

export default function PatentDetails() {
  const { isLoading, results, wasSearched } = useSearch();
  const { t } = useTranslation("common");

  const result = results?.[0];

  if (isLoading || !wasSearched) {
    return <Loader />;
  }

  if (wasSearched && results.length === 0) {
    return <NotFound />;
  }

  const patentId = result.id?.raw;

  return (
    <div>
      <Head>
        <title>{`${normalizeText(result.title?.raw)} | BrCris`}</title>
      </Head>

      <div className="mb-3 position-relative">
        <div className="d-flex justify-content-between align-items-center">
          <h1 className="title mb-0">{normalizeText(result.title?.raw)}</h1>
        </div>

        <div className="mt-2">
          <div className="d-flex justify-content-between w-100 flex-column flex-md-row gap-2 align-items-md-center">
            {patentId && (
              <div className="d-flex align-items-center gap-2">
                <img
                  className="brcris-logo"
                  src={withBasePath("/logos/brcris-grafo.svg")}
                  alt="logo do BrCris"
                />

                <CopyLink
                  link={`${location.origin}${withBasePath(`/patents/${patentId}`)}`}
                />
              </div>
            )}

            <div className="d-flex align-items-center gap-2">
              <DataUpdateModal />
              <ReportPopoverButton />
            </div>
          </div>
        </div>
      </div>

      <div className="details-card">
        <ul>
          {result.inventor?.raw?.length > 0 && (
            <li>
              <span className="sui-result__key">{t("Inventor(s)")}</span>

              <ExpandableContent
                items={result.inventor.raw}
                initialCount={5}
                renderItem={(inventor: any, idx: number) => {
                  const sameAsPatent = inventor.id === patentId;

                  const name = inventor.name.map(normalizeText).join("; ");

                  return (
                    <span key={idx} className="sui-result__value">
                      {sameAsPatent ? (
                        name
                      ) : (
                        <a href={withBasePath(`/people/${inventor.id}`)}>
                          {name}
                        </a>
                      )}
                    </span>
                  );
                }}
              />
            </li>
          )}

          {result.applicant?.raw?.length > 0 && (
            <li>
              <span className="sui-result__key">{t("Applicant")}</span>

              <ExpandableContent
                items={result.applicant.raw}
                initialCount={5}
                renderItem={(applicant: OrgUnit) => (
                  <a
                    key={applicant.id}
                    href={withBasePath(`/organizations/${applicant.id}`)}
                  >
                    {normalizeText(applicant.name)}
                  </a>
                )}
              />
            </li>
          )}

          <ShowItem label={t("Deposit date")} value={result.depositDate?.raw} />

          <ShowItem label={t("Kind Code")} value={result.kindCode?.raw} />

          <ShowItem label={t("Country code")} value={result.countryCode?.raw} />

          <ShowItem label={t("Lattes Title")} value={result.lattesTitle?.raw} />

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
              <span className="sui-result__key">{t("IPC Classification")}</span>

              <ExpandableContent
                items={result.IPCclassification.raw}
                initialCount={5}
                renderItem={(ipc: string, idx: number) => (
                  <span key={idx}>{ipc}</span>
                )}
              />
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
