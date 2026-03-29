import { ErrorBoundary, useSearch } from "@elastic/react-search-ui";
import Head from "next/head";
import { useTranslation } from "next-i18next";
import {
  _normalizeScientificTitle,
  normalizeDoiList,
} from "../../../utils/Utils";
import type { OrgUnit, Service } from "../../types/Entities";
import ShowAuthorItem from "../customResultView/ShowAuthorItem";
import ShowItem from "../customResultView/ShowItem";
import ExpandableContent from "../ExpandableContent";
import Loader from "../Loader";
import PopoverButton from "../PopOver";
export default function PublicationDetails() {
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
                <title>{`${_normalizeScientificTitle(result.title?.raw ?? "", "text")} | BrCris`}</title>
              </Head>
              <div className="d-flex justify-content-between align-items-center mb-3 position-relative">
                <h1
                  className="title mb-0"
                  dangerouslySetInnerHTML={{
                    __html: _normalizeScientificTitle(
                      result.title?.raw ?? "",
                      "html",
                    ),
                  }}
                />

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
                  <ShowItem
                    label={t("Year")}
                    value={result.publicationDate?.raw}
                  />
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
                                <a href={`/organizations/${org.id}`}>
                                  {org?.name}
                                </a>
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
                                    ? _normalizeScientificTitle(
                                        journal.title,
                                        "text",
                                      )
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
                  {result.oasisbrId?.raw?.length > 0 && (
                    <li>
                      <span className="identifier-key">
                        {t("Oasisbr identifier")}:
                      </span>
                      <span>
                        <ExpandableContent
                          items={result.oasisbrId.raw}
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
                    label={t("Award sponsored by")}
                    value={result.sponsorOrgUnit?.raw.map((org: any) => (
                      <a key={org.id} href={`/organizations/${org.id}`}>
                        {org.name?.[0]}
                      </a>
                    ))}
                  />

                  {/* <ShowItem label={t('Year 2')} value={result.year?.raw} /> */}
                  {result.doi?.raw &&
                    normalizeDoiList(result.doi.raw).length > 0 && (
                      <li>
                        <span className="identifier-key">{t("DOI")}:</span>
                        <span>
                          <ExpandableContent
                            items={normalizeDoiList(result.doi.raw)}
                            initialCount={5}
                            renderItem={(doi: string) => {
                              const url = `https://doi.org/${doi}`;
                              return (
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  {url}
                                </a>
                              );
                            }}
                          />
                        </span>
                      </li>
                    )}

                  <ShowItem
                    label={t("OpenalexId")}
                    value={result.openalexId?.raw}
                  />

                  {result.researchArea?.raw?.length > 0 &&
                    result.researchArea.raw.some(
                      (researchArea: any) => researchArea?.name,
                    ) && (
                      <ShowItem
                        label={t("Research field")}
                        value={result.researchArea.raw
                          .filter((researchArea: any) => researchArea?.name)
                          .map((researchArea: any) => (
                            <span key={researchArea.id}>
                              {researchArea.name}
                            </span>
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
                                <a href={`/programs/${program.id}`}>
                                  {program.name}
                                </a>
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
                              <a href={`/organizations/${item.id}`}>
                                {item?.name}
                              </a>
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
                  <ShowItem
                    label={t("Start Page")}
                    value={result.startPage?.raw}
                  />
                  <ShowItem label={t("End Page")} value={result.endPage?.raw} />
                  <ShowItem
                    label={t("Has Language")}
                    value={result.language?.raw}
                  />
                </ul>
              </div>
            </div>
          ))}
      </ErrorBoundary>
    </div>
  );
}
