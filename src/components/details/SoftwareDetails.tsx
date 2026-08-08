import { useSearch } from "@elastic/react-search-ui";
import Head from "next/head";
import { useTranslation } from "next-i18next";
import { formatDate, normalizeText } from "../../../utils/Utils";
import NotFound from "../../pages/404";
import CopyLink from "../CopyLink";
import ShowItem from "../customResultView/ShowItem";
import DataUpdateModal from "../DataUpdateModal";
import ExpandableContent from "../ExpandableContent";
import Loader from "../Loader";
import ReportPopoverButton from "../ReportPopoverButton";

export default function SoftwareDetails() {
  const { isLoading, results, wasSearched } = useSearch();
  const { t } = useTranslation("common");

  const result = results?.[0];

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

  const getEarliestYear = (value: any) => {
    if (!value) return "-";
    const values = Array.isArray(value) ? value : [value];
    const yearStrings = values
      .map((item) => String(item).trim())
      .filter(Boolean)
      .map((text) => {
        const match = text.match(/\d{4}/);
        return match ? match[0] : text;
      });

    const numericYears = yearStrings
      .map((year) => Number(year))
      .filter((year) => !Number.isNaN(year));

    return numericYears.length > 0
      ? String(Math.min(...numericYears))
      : (yearStrings[0] ?? "-");
  };

  const getEarliestDate = (value: any) => {
    if (!value) return "-";
    const values = Array.isArray(value) ? value : [value];
    const candidates = values
      .map((item) => String(item).trim())
      .filter(Boolean);

    const parsedDates = candidates
      .map((raw) => ({ raw, time: new Date(raw).getTime() }))
      .filter((item) => !Number.isNaN(item.time));

    if (parsedDates.length > 0) {
      return formatDate(parsedDates.sort((a, b) => a.time - b.time)[0].raw);
    }

    return formatDate(candidates[0]);
  };

  if (isLoading || !wasSearched) {
    return <Loader />;
  }

  if (wasSearched && results.length === 0) {
    return <NotFound />;
  }

  const softwareId = result.id?.raw;

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
            {softwareId && (
              <div className="d-flex align-items-center gap-2">
                <img
                  className="brcris-logo"
                  src="/logos/brcris-grafo.svg"
                  alt="logo do BrCris"
                />

                <CopyLink link={`${location.origin}/software/${softwareId}`} />
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
          <ShowItem label={t("Description")} value={result.description?.raw} />

          {result.creator?.raw?.length > 0 && (
            <li>
              <span className="sui-result__key">{t("Creator(s)")}</span>

              <ExpandableContent
                items={result.creator.raw}
                initialCount={5}
                renderItem={(item: any, idx: number) => (
                  <div key={idx} className="creator-item">
                    <a href={`/people/${item.id}`}>
                      {normalizeText(item?.name)}
                    </a>
                  </div>
                )}
              />
            </li>
          )}

          <ShowItem
            label={t("Release year")}
            value={getEarliestYear(result.releaseYear?.raw)}
          />

          <ShowItem
            label={t("Registration country")}
            value={result.registrationCountry?.raw}
          />

          <ShowItem label={t("Platform")} value={result.platform?.raw} />

          <ShowItem label={t("Kind")} value={result.kind?.raw} />

          <ShowItem
            label={t("Deposit date")}
            value={getEarliestDate(result.depositDate?.raw)}
          />

          <ShowItem
            label={t("Activity sector")}
            value={result.activitySector?.raw}
          />

          <ShowItem
            label={t("Knowledge areas")}
            value={formatDate(result.knowledgeAreas?.raw)}
          />

          <ShowItem label={t("Keywords")} value={result.keywords?.raw} />

          <ShowItem label={t("Has Language")} value={result.language?.raw} />

          <ShowItem label={t("Environment")} value={result.environment?.raw} />

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
  );
}
