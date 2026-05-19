import { useSearch } from "@elastic/react-search-ui";
import Head from "next/head";
import { useTranslation } from "next-i18next";
import {
  _normalizeScientificTitle,
  normalizeDoiList,
} from "../../../utils/Utils";
import NotFound from "../../pages/404";
import type { OrgUnit, Service } from "../../types/Entities";
import CopyLink from "../CopyLink";
import ShowAuthorItem from "../customResultView/ShowAuthorItem";
import ShowItem from "../customResultView/ShowItem";
import DataUpdateModal from "../DataUpdateModal";
import ExpandableContent from "../ExpandableContent";
import Loader from "../Loader";
import PopoverButton from "../PopOver";
import ReportPopoverButton from "../ReportPopoverButton";

export default function PublicationDetails() {
  const { t } = useTranslation("common");
  const { isLoading, results, wasSearched } = useSearch();
  const result = results?.[0];

  const citationTitle = _normalizeScientificTitle(
    String(result?.title?.raw ?? ""),
    "text",
  );
  const citationAuthors: string[] = Array.isArray(result?.author?.raw)
    ? result.author.raw
        .map((author: any) =>
          typeof author?.name === "string"
            ? author.name
            : typeof author?.name?.raw === "string"
              ? author.name.raw
              : "",
        )
        .filter(Boolean)
    : [];
  const citationPublicationDate = (() => {
    const rawDate = result?.publicationDate?.raw;
    const value = Array.isArray(rawDate) ? rawDate[0] : rawDate;
    if (!value) return "";

    const normalizedValue = String(value).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(normalizedValue)) {
      return normalizedValue.replace(/-/g, "/");
    }
    if (/^\d{4}\/\d{2}\/\d{2}$/.test(normalizedValue)) {
      return normalizedValue;
    }
    return normalizedValue;
  })();
  const citationJournalTitle = (() => {
    const journal = result?.journal?.raw?.[0];
    if (typeof journal?.title === "string") {
      return _normalizeScientificTitle(journal.title, "text");
    }
    if (typeof journal === "string") {
      return _normalizeScientificTitle(journal, "text");
    }
    const serviceTitle = result?.service?.raw?.[0]?.title?.[0];
    if (typeof serviceTitle === "string") {
      return _normalizeScientificTitle(serviceTitle, "text");
    }
    const orgUnitName = result?.orgunit?.raw?.[0]?.name;
    return typeof orgUnitName === "string" ? orgUnitName : "";
  })();
  const citationPdfUrl = (() => {
    if (!result?.doi?.raw) return "";
    const doiList = normalizeDoiList(result.doi.raw);
    return doiList.length > 0 ? `https://doi.org/${doiList[0]}` : "";
  })();

  if (isLoading || !wasSearched) {
    return <Loader />;
  }

  if (wasSearched && results.length === 0) {
    return <NotFound />;
  }

  return (
    <>
      <Head>
        <title>{`${citationTitle || t("Publication")} | BrCris`}</title>
        {citationTitle && (
          <meta name="citation_title" content={citationTitle} />
        )}
        {citationAuthors.map((author) => (
          <meta key={author} name="citation_author" content={author} />
        ))}
        {citationPublicationDate && (
          <meta
            name="citation_publication_date"
            content={citationPublicationDate}
          />
        )}
        {citationJournalTitle && (
          <meta name="citation_journal_title" content={citationJournalTitle} />
        )}
        {citationPdfUrl && (
          <meta name="citation_pdf_url" content={citationPdfUrl} />
        )}
      </Head>
      <div key={result.id}>
        <div className="d-flex justify-content-between align-items-start mb-3 position-relative">
          <div className="w-100">
            <h1
              className="title mb-0"
              dangerouslySetInnerHTML={{
                __html: _normalizeScientificTitle(
                  result?.title?.raw ?? "",
                  "html",
                ),
              }}
            />

            <div className="d-flex align-items-center justify-content-between w-100 flex-wrap gap-3 mt-2">
              <div className="d-flex align-items-center gap-3 flex-wrap">
                {result.oasisbrId?.raw?.length > 0 &&
                  (() => {
                    const id = result.oasisbrId.raw[0];
                    const searchUrl = `https://oasisbr.ibict.br/vufind/Record/${id}`;

                    return (
                      <a
                        href={searchUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="d-flex align-items-center gap-2 flex-shrink-0"
                      >
                        <img
                          src="/logos/oasisbr.ico"
                          alt="Oasisbr"
                          style={{ width: 20 }}
                        />
                        Oasisbr
                      </a>
                    );
                  })()}

                {result.doi?.raw &&
                  normalizeDoiList(result.doi.raw).length > 0 &&
                  (() => {
                    const doi = normalizeDoiList(result.doi.raw)[0];
                    const url = `https://doi.org/${doi}`;

                    return (
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="d-flex align-items-center gap-2 flex-shrink-0"
                      >
                        <img
                          src="/logos/DOI_logo.svg"
                          alt="DOI"
                          style={{ width: 20 }}
                        />
                        DOI
                      </a>
                    );
                  })()}

                {result.id?.raw && (
                  <div className="d-flex align-items-center gap-2 flex-shrink-0">
                    <img
                      className="brcris-logo"
                      src="/logos/brcris-grafo.svg"
                      alt="logo do BrCris"
                    />

                    <CopyLink
                      link={`${location.origin}/publications/${result.id.raw}`}
                    />
                  </div>
                )}
              </div>

              <div className="d-flex align-items-center justify-content-md-end justify-content-between w-100 w-md-auto gap-2 flex-shrink-0">
                <DataUpdateModal />
                <ReportPopoverButton />
              </div>
            </div>
          </div>

          <PopoverButton />
        </div>
        <div className="details-card">
          <ul>
            {result.author?.raw?.length > 0 && (
              <li>
                <span className="sui-result__key">{t("Author")}</span>
                <ExpandableContent
                  items={[...result.author.raw].sort((a: any, b: any) =>
                    String(a?.name?.raw ?? a?.name ?? "").localeCompare(
                      String(b?.name?.raw ?? b?.name ?? ""),
                    ),
                  )}
                  initialCount={5}
                  renderItem={(item: any, idx: number) => (
                    <div key={idx} className="member-item">
                      <a href={`/people/${item.id}`}>{item?.name}</a>
                    </div>
                  )}
                />
              </li>
            )}
            <ShowItem label={t("Year")} value={result.publicationDate?.raw} />
            <ShowItem label={t("Type")} value={result.type?.raw} />
            {result.orgunit === undefined &&
            result.service === undefined &&
            result.journal === undefined ? null : (
              <li>
                <span className="sui-result__key">
                  {result.type?.raw === "doctoral thesis" ||
                  result.type?.raw === "master thesis"
                    ? `${t("Organization")}`
                    : result.type?.raw === "conference proceedings"
                      ? `${t("Organization")}`
                      : `${t("Journals")}`}
                </span>

                <span>
                  {/* ORGUNIT */}
                  {result.orgunit?.raw?.length > 0 && (
                    <ExpandableContent
                      items={result.orgunit.raw}
                      initialCount={5}
                      renderItem={(org: OrgUnit, idx: number) => (
                        <div key={idx}>
                          <a href={`/organizations/${org.id}`}>{org?.name}</a>
                        </div>
                      )}
                    />
                  )}

                  {/* SERVICE */}
                  {result.service?.raw?.length > 0 && (
                    <ExpandableContent
                      items={result.service.raw}
                      initialCount={5}
                      renderItem={(service: Service, idx: number) => (
                        <div key={idx}>
                          {service.title?.map((title: string) => (
                            <a key={title} href={`/serv_${service.id}`}>
                              {_normalizeScientificTitle(title, "text")}
                            </a>
                          ))}
                        </div>
                      )}
                    />
                  )}

                  {/* JOURNAL */}
                  {result.journal?.raw?.length > 0 && (
                    <ExpandableContent
                      items={result.journal.raw}
                      initialCount={5}
                      renderItem={(journal: any, idx: number) => (
                        <div key={idx}>
                          <a href={`/journals/${journal.id}`}>
                            {journal.title
                              ? _normalizeScientificTitle(journal.title, "text")
                              : journal}
                          </a>
                        </div>
                      )}
                    />
                  )}
                </span>
              </li>
            )}
            {result.capesId?.raw?.length > 0 && (
              <li>
                <span className="identifier-key">{t("Capes identifier")}:</span>
                <span>
                  <ExpandableContent
                    items={result.capesId.raw}
                    initialCount={5}
                    renderItem={(item: string) => <>{item}</>}
                  />
                </span>
              </li>
            )}
            <ShowAuthorItem
              label={t("Advisor")}
              authors={result.advisor?.raw}
            />
            <ShowAuthorItem
              label={t("Coadvisor")}
              authors={result.coadvisor?.raw}
            />
            <ShowItem
              label={t("Affiliation")}
              value={result.sponsorOrgUnit?.raw.map((org: any) => (
                <a key={org.id} href={`/organizations/${org.id}`}>
                  {org.name?.[0]}
                </a>
              ))}
            />

            {/* <ShowItem label={t('Year 2')} value={result.year?.raw} /> */}
            <ShowItem label={t("OpenalexId")} value={result.openalexId?.raw} />

            {result.researchArea?.raw?.length > 0 &&
              result.researchArea.raw.some(
                (researchArea: any) => researchArea?.name,
              ) && (
                <ShowItem
                  label={t("Research field")}
                  value={result.researchArea.raw
                    .filter((researchArea: any) => researchArea?.name)
                    .map((researchArea: any) => (
                      <span key={researchArea.id}>{researchArea.name}</span>
                    ))}
                />
              )}

            {result.conference?.raw?.length > 0 && (
              <ShowItem
                label={t("Conference")}
                value={result.conference.raw.map((conference: any) => (
                  <span key={conference.id}>{conference.name}</span>
                ))}
              />
            )}
            {result.program?.raw?.length > 0 && (
              <li>
                <span className="sui-result__key">{t("Program")}</span>
                <span>
                  <ExpandableContent
                    items={result.program.raw}
                    initialCount={5}
                    renderItem={(program: any) => (
                      <>
                        {program.name && (
                          <a href={`/programs/${program.id}`}>{program.name}</a>
                        )}
                      </>
                    )}
                  />
                </span>
              </li>
            )}
            {result.course?.raw?.length > 0 && (
              <li>
                <span className="sui-result__key">{t("Course")}</span>
                <span>
                  <ExpandableContent
                    items={result.course.raw}
                    initialCount={5}
                    renderItem={(item: any) => (
                      <>
                        <a href={`/organizations/${item.id}`}>{item?.name}</a>
                      </>
                    )}
                  />
                </span>
              </li>
            )}
            <ShowItem label={t("Series")} value={result.series?.raw} />
            <ShowItem label={t("Edition")} value={result.edition?.raw} />
            <ShowItem label={t("Volume")} value={result.volume?.raw} />
            <ShowItem label={t("Issue")} value={result.issue?.raw} />
            <ShowItem label={t("Start Page")} value={result.startPage?.raw} />
            <ShowItem label={t("End Page")} value={result.endPage?.raw} />
            <ShowItem label={t("Has Language")} value={result.language?.raw} />
          </ul>
        </div>
      </div>
    </>
  );
}
