import { useSearch } from "@elastic/react-search-ui";
import Head from "next/head";
import { useTranslation } from "next-i18next";
import { formatDate } from "../../../utils/Utils";
import NotFound from "../../pages/404";
import CopyLink from "../CopyLink";
import ShowItem from "../customResultView/ShowItem";
import ExpandableContent from "../ExpandableContent";
import Loader from "../Loader";
import ReportPopoverButton from "../ReportPopoverButton";

export default function SoftwareDetails() {
  const { isLoading, results } = useSearch();
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

  if (isLoading) {
    return <Loader />;
  }

  if (!result) {
    return <NotFound />;
  }

  const softwareId = result.id?.raw;

  return (
    <div>
      <Head>
        <title>{`${result.title?.raw} | BrCris`}</title>
      </Head>

      <div className="mb-3 position-relative">
        <div className="d-flex justify-content-between align-items-center">
          <h1 className="title mb-0">{result.title?.raw}</h1>
        </div>

        <div className="mt-2">
          {softwareId && (
            <div className="d-flex align-items-center gap-2">
              <img
                className="brcris-logo"
                src="/logos/brcris-grafo.svg"
                alt="logo do BrCris"
              />

              <CopyLink link={`${location.origin}/software/${softwareId}`} />

              <ReportPopoverButton />
            </div>
          )}
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
                    <a href={`/people/${item.id}`}>{item?.name}</a>
                  </div>
                )}
              />
            </li>
          )}

          <ShowItem label={t("Release year")} value={result.releaseYear?.raw} />

          <ShowItem
            label={t("Registration country")}
            value={result.registrationCountry?.raw}
          />

          <ShowItem label={t("Platform")} value={result.platform?.raw} />

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
