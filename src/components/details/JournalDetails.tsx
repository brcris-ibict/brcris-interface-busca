import { useSearch } from "@elastic/react-search-ui";
import Head from "next/head";
import { useTranslation } from "next-i18next";
import { CSVLink } from "react-csv";
import { formatBooleanString } from "../../../utils/Utils";
import { usePublicationYears } from "../../hooks/usePublicationYears";
import NotFound from "../../pages/404";
import CopyLink from "../CopyLink";
import ShowAuthorItem from "../customResultView/ShowAuthorItem";
import ShowItem from "../customResultView/ShowItem";
import ExpandableContent from "../ExpandableContent";
import Loader from "../Loader";
import PopoverButton from "../PopOver";
import ReportPopoverButton from "../ReportPopoverButton";

const journalCsvHeaders = [
  { label: "Título", key: "title" },
  { label: "ID", key: "id" },
  { label: "Ano", key: "year" },
];
export default function JournalDetails() {
  const { isLoading, results } = useSearch();
  const { t } = useTranslation("common");

  const result = results?.[0];

  const publications = result?.publication?.raw || [];

  const publicationIds = publications.map((p: any) => p.id) ?? [];

  const { data: yearsData } = usePublicationYears(publicationIds);

  const yearMap = new Map((yearsData || []).map((y: any) => [y.id, y.year]));

  const getYearById = (id: string) => yearMap.get(id) || "";
  const sortedPublications = [...publications].sort((a, b) => {
    const yearA = Number(getYearById(a.id)) || 0;
    const yearB = Number(getYearById(b.id)) || 0;

    return yearB - yearA;
  });
  const publicationsWithYear = [...publications]
    .map((p: any) => ({
      ...p,
      year: yearMap.get(p.id) || "",
    }))
    .sort((a, b) => {
      const yearA = Number(a.year) || 0;
      const yearB = Number(b.year) || 0;

      return yearB - yearA;
    });
  const formattedPublicationsForCsv = publicationsWithYear.map((p: any) => ({
    title: p?.title ?? "",
    id: p?.id ?? "",
    year: p?.year ?? "",
  }));
  if (isLoading) {
    return <Loader />;
  }

  if (!isLoading && !result) {
    return <NotFound />;
  }
  return (
    <div key={result.id}>
      <Head>
        <title>{`${result.title?.raw} | BrCris`}</title>
      </Head>
      <div className="mb-3 position-relative">
        <div className="d-flex justify-content-between align-items-center">
          <h1 className="title mb-0">{result.title?.raw}</h1>
          <PopoverButton />
        </div>

        <div className="mt-2">
          {result.id?.raw && (
            <div className="d-flex align-items-center gap-2">
              <img
                className="brcris-logo"
                src="/logos/brcris-grafo.svg"
                alt="logo do BrCris"
              />
              <CopyLink link={`${location.origin}/journals/${result.id.raw}`} />
              <ReportPopoverButton />
            </div>
          )}
        </div>
      </div>
      <div className="details-card">
        <ul>
          <ShowItem label={t("Type")} value={result.type?.raw} />
          {result.researchArea?.raw?.length > 0 && (
            <li>
              <span className="sui-result__key">{t("Has subject area")}</span>
              <ExpandableContent
                items={result.researchArea?.raw}
                initialCount={5}
                renderItem={(area: any, idx: number) => (
                  <div key={idx} className="research-area-item">
                    {area?.name}
                  </div>
                )}
              />
            </li>
          )}
          <ShowAuthorItem
            label={t("Publisher")}
            authors={result.publisher?.raw}
          />
          <ShowItem
            label={t("Is open access")}
            value={formatBooleanString(result.isOA?.raw[0], t)}
          />
          <ShowItem
            label={t("Is in DOAJ")}
            value={formatBooleanString(result.isInDoaj?.raw[0], t)}
          />
          <ShowItem
            label={t("2 year mean citedness")}
            value={result.googleH5?.raw}
          />
          <ShowItem label={t("H index")} value={result.h_index?.raw} />
          <ShowItem label={t("I10 index")} value={result.i10_index?.raw} />
          <ShowItem label={t("ISSN-L")} value={result.issn_l?.raw} />
          {result.issn?.raw?.length > 0 && (
            <li>
              <span className="sui-result__key">
                {t("International Standard Serial Number (ISSN)")}
              </span>
              <span>
                <ExpandableContent
                  items={
                    Array.isArray(result.issn.raw)
                      ? result.issn.raw
                      : [result.issn.raw]
                  }
                  initialCount={5}
                  renderItem={(issn: string, idx: number) => {
                    const url = `https://portal.issn.org/resource/ISSN/${issn}`;
                    return (
                      <div key={idx}>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="break-url"
                        >
                          {url}
                        </a>
                      </div>
                    );
                  }}
                />
              </span>
            </li>
          )}

          <ShowItem
            label={t("Qualis classification")}
            value={result.qualis?.raw}
          />
          {publications.length > 0 && (
            <li>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <strong className="research-title">
                  {t("Publications")}: ({publications.length})
                </strong>
                {/* @ts-ignore */}

                <CSVLink
                  data={formattedPublicationsForCsv}
                  headers={journalCsvHeaders}
                  filename={`publicacoes-${result.title?.raw ?? "journal"}.csv`}
                  className="btn btn-primary btn-sm"
                >
                  ⬇ {t("Export csv")}
                </CSVLink>
              </div>

              <ExpandableContent
                items={sortedPublications}
                initialCount={5}
                renderItem={(publication: any) => (
                  <div className="publication-item">
                    <a href={`/publications/${publication?.id}`}>
                      {publication?.title}
                    </a>

                    {getYearById(publication?.id) && (
                      <div className="publication-meta">
                        {getYearById(publication?.id)}
                      </div>
                    )}
                  </div>
                )}
              />
            </li>
          )}
          <ShowItem label={t("Access type")} value={result.accessType?.raw} />
          <ShowItem label={t("Status")} value={result.status?.raw} />
          <ShowItem label={t("Language")} value={result.language?.raw} />
          <ShowItem label={t("Country code")} value={result.countryCode?.raw} />
          <ShowItem
            label={t("Assessment area")}
            value={result.assessmentArea?.raw}
          />
          <ShowItem label={t("Keywords")} value={result.keywords?.raw} />
        </ul>
      </div>
    </div>
  );
}
