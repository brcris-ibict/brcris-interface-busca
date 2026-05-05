import { ErrorBoundary, useSearch } from "@elastic/react-search-ui";
import Head from "next/head";
import { useTranslation } from "next-i18next";
import { formatDate } from "../../../utils/Utils";
import CopyLink from "../CopyLink";
import ShowItem from "../customResultView/ShowItem";
import ExpandableContent from "../ExpandableContent";
import Loader from "../Loader";
import ReportPopoverButton from "../ReportPopoverButton";
export default function SoftwareDetails() {
  const { wasSearched, isLoading, results } = useSearch();
  const { t } = useTranslation("common");
  const formatValue = (value: any) => {
    if (!value) return "-";

    if (Array.isArray(value)) {
      const filtered = value.filter((v) => v && v !== "----");
      return filtered.length > 0 ? filtered.join(", ") : "-";
    }

    if (typeof value === "string") {
      const clean = value.replace(/-+/g, "").trim();
      return clean ? value : "-";
    }

    return value;
  };
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
                        link={`${location.origin}/software/${result.id.raw}`}
                      />
                      <ReportPopoverButton />
                    </div>
                  )}
                </div>
              </div>
              <div className="details-card">
                <ul>
                  <ShowItem
                    label={t("Description")}
                    value={result.description?.raw}
                  />
                  {/* <ShowAuthorItem label={t('Creator(s)')} authors={result.creator?.raw} /> */}
                  {result.creator?.raw?.length > 0 && (
                    <li>
                      <span className="sui-result__key">{t("Creator(s)")}</span>
                      <ExpandableContent
                        items={result.creator?.raw}
                        initialCount={5}
                        renderItem={(item: any, idx: number) => (
                          <div key={idx} className="creator-item">
                            <a href={`/people/${item.id}`}>{item?.name}</a>
                          </div>
                        )}
                      />
                    </li>
                  )}
                  <ShowItem
                    label={t("Release year")}
                    value={result.releaseYear?.raw}
                  />
                  <ShowItem
                    label={t("Registration country")}
                    value={result.registrationCountry?.raw}
                  />
                  <ShowItem
                    label={t("Platform")}
                    value={result.platform?.raw}
                  />
                  <ShowItem label={t("Kind")} value={result.kind?.raw} />
                  <ShowItem
                    label={t("Deposit date")}
                    value={formatDate(result.depositDate?.raw)}
                  />
                  <ShowItem
                    label={t("Activity sector")}
                    value={result.activitySector?.raw}
                  />
                  <ShowItem
                    label={t("Knowledge areas")}
                    value={formatDate(result.knowledgeAreas?.raw)}
                  />
                  <ShowItem
                    label={t("Keywords")}
                    value={result.keywords?.raw}
                  />
                  <ShowItem
                    label={t("Has Language")}
                    value={result.language?.raw}
                  />
                  <ShowItem
                    label={t("Environment")}
                    value={result.environment?.raw}
                  />
                  <ShowItem
                    label={t("Availability")}
                    value={result.availability?.raw}
                  />
                  <ShowItem
                    label={t("ConcessionDate")}
                    value={formatDate(result.concessionDate?.raw)}
                  />
                  <ShowItem
                    label={t("FundingInstitution")}
                    value={formatValue(result.fundingInstitution?.raw)}
                  />
                  <ShowItem
                    label={t("RegistrationInstitution")}
                    value={result.registrationInstitution?.raw}
                  />
                  <ShowItem label={t("InpiUrl")} value={result.inpiUrl?.raw} />
                  <ShowItem label={t("Doi")} value={result.doi?.raw} />
                  <ShowItem
                    label={t("InpiRegistrationCode")}
                    value={result.inpiRegistrationCode?.raw}
                  />
                </ul>
              </div>
            </div>
          ))}
      </ErrorBoundary>
    </div>
  );
}
