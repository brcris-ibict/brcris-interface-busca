import { useSearch } from "@elastic/react-search-ui";
import Head from "next/head";
import { useTranslation } from "next-i18next";
import { CSVLink } from "react-csv";
import { usePublicationYears } from "../../hooks/usePublicationYears";
import NotFound from "../../pages/404";
import type { OrgUnit } from "../../types/Entities";
import CopyLink from "../CopyLink";
import ShowItem from "../customResultView/ShowItem";
import DataUpdateModal from "../DataUpdateModal";
import ExpandableContent from "../ExpandableContent";
import Loader from "../Loader";
import ReportPopoverButton from "../ReportPopoverButton";

export default function CourseDetails() {
  const { isLoading, results, wasSearched } = useSearch();
  const { t } = useTranslation("common");

  const result = results?.[0];
  const publicationIds =
    result?.publication?.raw
      ?.map((publication: any) => publication?.id)
      .filter(Boolean) || [];
  const { data: publicationMetadata = [] } =
    usePublicationYears(publicationIds);
  const publicationMetadataMap = new Map(
    publicationMetadata.map((item: any) => [item.id, item]),
  );

  const publicationCsvHeaders = [
    { label: "ID", key: "id" },
    { label: "Título", key: "title" },
    { label: "Ano", key: "year" },
    { label: "Autor", key: "author" },
  ];

  const formatPublicationAuthors = (publication: any) => {
    const metadata = publicationMetadataMap.get(publication?.id) || {};
    if (Array.isArray(metadata.authors) && metadata.authors.length > 0) {
      return metadata.authors.join("; ");
    }

    const rawAuthors = publication?.author?.raw;
    if (!Array.isArray(rawAuthors)) return "";

    return rawAuthors
      .map((author: any) =>
        typeof author?.name === "string"
          ? author.name
          : typeof author?.name?.raw === "string"
            ? author.name.raw
            : "",
      )
      .filter(Boolean)
      .join("; ");
  };

  const sortedPublications =
    result?.publication?.raw?.slice().sort((a: any, b: any) => {
      const aMetadata = publicationMetadataMap.get(a?.id) || {};
      const bMetadata = publicationMetadataMap.get(b?.id) || {};
      const aYear = Number(aMetadata.year || a?.publicationDate?.[0] || 0);
      const bYear = Number(bMetadata.year || b?.publicationDate?.[0] || 0);

      return bYear - aYear;
    }) || [];

  const formattedPublicationsForCsv = sortedPublications.map(
    (publication: any) => {
      const rawPublicationDate = publication?.publicationDate;
      const fallbackYear = Array.isArray(rawPublicationDate)
        ? rawPublicationDate[0]
        : rawPublicationDate || "";
      const year =
        publicationMetadataMap.get(publication?.id)?.year || fallbackYear || "";

      return {
        id: publication?.id ?? "",
        title: publication?.title ?? "",
        year,
        author: formatPublicationAuthors(publication),
      };
    },
  );

  if (isLoading || !wasSearched) {
    return <Loader />;
  }

  if (wasSearched && results.length === 0) {
    return <NotFound />;
  }

  const courseId = result.id?.raw;

  return (
    <div>
      <Head>
        <title>{`${result.name?.raw} | BrCris`}</title>
      </Head>

      <div className="mb-3 position-relative">
        <div className="d-flex justify-content-between align-items-center">
          <h1 className="title mb-0">{result.name?.raw}</h1>
        </div>

        <div className="mt-2">
          <div className="d-flex justify-content-between w-100 flex-column flex-md-row gap-2 align-items-md-center">
            {courseId && (
              <div className="d-flex align-items-center gap-2">
                <img
                  className="brcris-logo"
                  src="/logos/brcris-grafo.svg"
                  alt="logo do BrCris"
                />

                <CopyLink link={`${location.origin}/courses/${courseId}`} />
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
          <ShowItem label={t("Degree")} value={result.degree?.raw} />

          <ShowItem label={t("Type")} value={result.type?.raw} />

          <ShowItem label={t("Start date")} value={result.startDate?.raw} />

          <ShowItem label={t("End date")} value={result.endDate?.raw} />

          {result.program?.raw?.length > 0 && (
            <li>
              <span className="sui-result__key">{t("Program")}</span>

              <ExpandableContent
                items={
                  Array.isArray(result.program.raw)
                    ? result.program.raw
                    : [result.program.raw]
                }
                initialCount={3}
                renderItem={(program: OrgUnit, idx: number) => (
                  <span key={idx}>
                    <a href={`/programs/${program.id}`}>{program.name}</a>
                  </span>
                )}
              />
            </li>
          )}

          {result.orgUnit?.raw?.length > 0 && (
            <li>
              <span className="sui-result__key">
                {t("Organizational Unit")}
              </span>

              <ExpandableContent
                items={
                  Array.isArray(result.orgUnit.raw)
                    ? result.orgUnit.raw
                    : [result.orgUnit.raw]
                }
                initialCount={3}
                renderItem={(unit: OrgUnit, idx: number) => (
                  <span key={idx}>
                    <a href={`/organizations/${unit.id}`}>{unit.name}</a>
                  </span>
                )}
              />
            </li>
          )}

          {sortedPublications.length > 0 && (
            <li>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="sui-result__key">{t("Publications")}</span>
                <CSVLink
                  data={formattedPublicationsForCsv}
                  headers={publicationCsvHeaders}
                  filename={`publicacoes-${result.name?.raw ?? "curso"}.csv`}
                  className="btn btn-primary btn-sm"
                >
                  ⬇ {t("Export csv")}
                </CSVLink>
              </div>

              <ExpandableContent
                items={sortedPublications}
                initialCount={5}
                renderItem={(publication: any) => {
                  const metadata =
                    publicationMetadataMap.get(publication?.id) || {};
                  const rawPublicationDate = publication?.publicationDate;
                  const fallbackYear = Array.isArray(rawPublicationDate)
                    ? rawPublicationDate[0]
                    : rawPublicationDate || "";
                  const year = metadata.year || fallbackYear || "";
                  const authors =
                    metadata.authors?.join(", ") ||
                    (Array.isArray(publication?.author?.raw)
                      ? publication.author.raw.join(", ")
                      : "");

                  return (
                    <div key={publication?.id} className="publication-item">
                      <a href={`/publications/${publication?.id}`}>
                        {publication?.title}
                      </a>
                      <div className="publication-meta">
                        {[year, authors].filter(Boolean).join(" - ")}
                      </div>
                    </div>
                  );
                }}
              />
            </li>
          )}

          {result.capesId?.raw?.length > 0 && (
            <li>
              <span className="identifier-key">{t("Capes identifier")}:</span>

              <ExpandableContent
                items={result.capesId.raw}
                initialCount={5}
                renderItem={(item: string) => <>{item}</>}
              />
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
