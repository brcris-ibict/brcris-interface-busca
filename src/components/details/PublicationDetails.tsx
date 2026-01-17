import { ErrorBoundary, useSearch } from "@elastic/react-search-ui";
import Head from "next/head";
import { useTranslation } from "next-i18next";
import type { OrgUnit, Service } from "../../types/Entities";
import ShowAuthorItem from "../customResultView/ShowAuthorItem";
import ShowItem from "../customResultView/ShowItem";
import ExpandableContent from "../ExpandableContent";
import Loader from "../Loader";

export default function PublicationDetails() {
  const { wasSearched, isLoading, results } = useSearch();
  const { t } = useTranslation("common");

  type TitleFormat = "html" | "text";

  function _normalizeScientificTitle(
    input: string | string[] | undefined,
    format: TitleFormat = "html",
  ) {
    if (!input) return "";

    // ✅ Garante string
    let t = Array.isArray(input) ? input[0] : input;

    if (typeof t !== "string") return "";

    // Decodifica HTML
    t = t.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");

    // Normalizações científicas
    t = t.replace(/<\/sup>\s*o/g, "</sup>O");
    t = t.replace(/<\/sup>\s*c/g, "</sup>C");
    t = t.replace(/co<sub>2<\/sub>/gi, "CO<sub>2</sub>");
    t = t.replace(/\bamazonian\b/gi, "Amazonian");

    // Texto puro (SEO / <title>)
    if (format === "text") {
      t = t
        .replace(/<[^>]+>/g, "")
        .replace(/18o\/16o/gi, "18O/16O")
        .replace(/13c\/12c/gi, "13C/12C")
        .replace(/co2/gi, "CO2");
    }

    return t;
  }

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
              <h1
                className="title"
                dangerouslySetInnerHTML={{
                  __html: _normalizeScientificTitle(
                    result.title?.raw ?? "",
                    "html",
                  ),
                }}
              />

              <div className="details-card">
                <ul>
                  {result.author?.raw?.length > 0 && (
                    <li>
                      <span className="sui-result__key">{t("Author")}</span>
                      <ExpandableContent
                        items={result.author?.raw}
                        initialCount={5}
                        renderItem={(item: any, idx: number) => (
                          <div key={idx} className="author-item">
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
                        {result.orgunit?.raw.map((org: OrgUnit) => (
                          <a key={org.id} href={`/organizations/${org.id}`}>
                            {org?.name}
                          </a>
                        ))}

                        {result.service?.raw.map((service: Service) =>
                          service.title?.map((title: string) => (
                            <a key={title} href={`/serv_${service.id}`}>
                              {title}
                            </a>
                          )),
                        )}

                        {result.journal?.raw.map((journal: any) => (
                          <a key={journal.id} href={`/journals/${journal.id}`}>
                            {journal.title ? journal.title : journal}
                          </a>
                        ))}
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
                  <ShowItem label={t("DOI")} value={result.doi?.raw} />
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
