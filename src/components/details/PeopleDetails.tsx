import { ErrorBoundary, useSearch } from "@elastic/react-search-ui";
import Head from "next/head";
import { useTranslation } from "next-i18next";
import CopyLink from "../CopyLink";
import ShowItem from "../customResultView/ShowItem";
import ExpandableContent from "../ExpandableContent";
import Loader from "../Loader";
import AdvisorGraph from "./AdvisorGraph";
import ChordDiagram from "./ChordDiagram";
import PatentsByInventor from "./PatentsByInventor";
import PersonProduction from "./PersonProduction";
import SoftwareTitle from "./SoftwareTitle";

export default function PeopleDetails() {
  const { wasSearched, isLoading, results } = useSearch();
  const { t } = useTranslation("common");
  const { i18n } = useTranslation();

  function detectBioLanguage(text: string): "pt" | "en" {
    const ptHits = (
      text.match(
        /\b(de|da|do|dos|das|com|pela|pelo|foi|atuou|atualmente|possui|seus|sua|universidade)\b/gi,
      ) || []
    ).length;

    const enHits = (
      text.match(
        /\b(at|from|has|experience|focusing|acting|currently|research|and)\b/gi,
      ) || []
    ).length;

    return enHits >= ptHits ? "en" : "pt";
  }

  function getBioByLanguage(bioArray: string[] | undefined) {
    if (!Array.isArray(bioArray) || bioArray.length === 0) return "";

    const lang = i18n.language.startsWith("pt") ? "pt" : "en";

    if (bioArray.length === 1) return bioArray[0];

    const scored = bioArray.map((text) => ({
      text,
      lang: detectBioLanguage(text),
    }));

    const preferred = scored.find((b) => b.lang === lang);

    return preferred?.text ?? bioArray[0];
  }

  function getLattesIdentifier(lattesId?: string[]) {
    if (!Array.isArray(lattesId) || lattesId.length === 0) return null;

    const clean = lattesId.find((id) => !id.includes("::"));
    if (clean) return clean;

    return lattesId[0].split("::").pop() ?? null;
  }

  return (
    <>
      {isLoading && <Loader />}
      <ErrorBoundary>
        {wasSearched &&
          results &&
          results.length > 0 &&
          results?.map((result) => (
            <div key={result.id?.raw}>
              <div className="details-content">
                <div className="details-main">
                  <Head>
                    <title>{`${result.name?.raw} | BrCris`}</title>
                  </Head>
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="author-header">
                      <h1>{result.name?.raw}</h1>
                    </div>
                  </div>
                  <div className="d-flex flex-wrap align-items-center gap-3 mb-3">
                    {getLattesIdentifier(result.lattesId?.raw) && (
                      <a
                        href={`http://lattes.cnpq.br/${getLattesIdentifier(result.lattesId?.raw)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <img
                          className="lattes-logo"
                          src="/logos/lattes.png"
                          alt="logo do Lattes"
                        />
                        Lattes
                      </a>
                    )}
                    {result.orcid?.raw && (
                      <a
                        href={`https://orcid.org/${result.orcid?.raw}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="d-flex align-items-center gap-2"
                      >
                        <img
                          className="orcid-logo"
                          src="/logos/logo_orcid.png"
                          alt="logo do ORCID"
                        />
                        ORCID
                      </a>
                    )}

                    {result.id?.raw && (
                      <div className="d-flex align-items-center gap-2">
                        <img
                          className="brcris-logo"
                          src="/logos/logo-brcris.png"
                          alt="logo do BrCris"
                        />
                        <CopyLink
                          link={`${location.origin}/people/${result.id.raw}`}
                        />
                      </div>
                    )}
                  </div>
                  <div className="details-card">
                    <div>
                      <ExpandableContent
                        text={getBioByLanguage(result.bio?.raw)}
                        maxLines={5}
                      />
                    </div>
                    {Array.isArray(result.researchArea?.raw) &&
                      result.researchArea.raw.length > 0 && (
                        <div className="research-fields">
                          <strong className="research-title">
                            {t("Research field")}
                          </strong>

                          <div className="chips-container">
                            {result.researchArea.raw.map((area: string) => (
                              <span key={area} className="chip">
                                {area}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    <ul className="sui-result__details">
                      <ShowItem
                        label={t("Nationality")}
                        value={result.nationality?.raw}
                      />
                      <ShowItem
                        label={t("Affiliation")}
                        value={result.affiliation?.raw?.map((orgunit: any) => (
                          <span key={orgunit.id} className="sui-result__value">
                            <a
                              key={orgunit.id}
                              href={`/organizations/${orgunit?.id}`}
                            >
                              {orgunit?.name}
                            </a>
                          </span>
                        ))}
                      />
                      {(result.memberOf?.raw?.length > 0 ||
                        result.leaderOf?.raw?.length > 0) && (
                        <li className="sui-result__item">
                          <span className="sui-result__key">
                            {t("Research groups")}
                          </span>
                          <span className="sui-result__value">
                            {(() => {
                              const groupsMap = new Map<string, any>();

                              (result.memberOf?.raw || []).forEach(
                                (item: any) => {
                                  if (item?.id) {
                                    groupsMap.set(item.id, {
                                      ...item,
                                      role: "Member",
                                    });
                                  }
                                },
                              );

                              (result.leaderOf?.raw || []).forEach(
                                (item: any) => {
                                  if (item?.id) {
                                    groupsMap.set(item.id, {
                                      ...item,
                                      role: "Leader of",
                                    });
                                  }
                                },
                              );

                              return Array.from(groupsMap.values()).map(
                                (item: any, index: number) => (
                                  <span key={item.id} className="group-item">
                                    {item.id ? (
                                      <a href={`/research-groups/${item.id}`}>
                                        {item.name}
                                      </a>
                                    ) : (
                                      item.name
                                    )}
                                    {` (${t(item.role)})`}
                                    {index < groupsMap.size - 1 && ", "}
                                  </span>
                                ),
                              );
                            })()}
                          </span>
                        </li>
                      )}
                      {result.brcrisId?.raw?.length > 0 && (
                        <li>
                          <span className="sui-result__key">
                            {t("BrCris identifier")}
                          </span>
                          <span>
                            <ExpandableContent
                              items={
                                Array.isArray(result.brcrisId.raw)
                                  ? result.brcrisId.raw
                                  : [result.brcrisId.raw]
                              }
                              initialCount={5}
                              renderItem={(id: string, idx: number) => (
                                <span key={idx}>{id}</span>
                              )}
                            />
                          </span>
                        </li>
                      )}

                      {result.id?.raw && (
                        <PatentsByInventor personId={result.id.raw} />
                      )}

                      {result.creatorOf?.raw?.length > 0 && (
                        <li>
                          <strong className="research-title">
                            {t("Software")}
                          </strong>
                          <ExpandableContent
                            items={result.creatorOf.raw}
                            initialCount={5}
                            renderItem={(item: any, idx: number) => (
                              <span key={idx}>
                                <a href={`/software/${item.id}`}>
                                  <SoftwareTitle softwareId={item.id} />
                                </a>
                              </span>
                            )}
                          />
                        </li>
                      )}

                      {/*
                      <li>
                        <strong className="research-title">
                          {t("Publications")} ()
                        </strong>
                        <ExpandableContent
                          items={result.authorOf?.raw
                            ?.slice()
                            ?.sort((a: any, b: any) => {
                              const dateA = new Date(
                                a.publicationDate?.[0] || 0,
                              ).getTime();
                              const dateB = new Date(
                                b.publicationDate?.[0] || 0,
                              ).getTime();
                              return dateB - dateA;
                            })}
                          initialCount={5}
                          renderItem={(publication: any) => (
                            <div className="publication-item">
                              <a href={`/publications/${publication?.id}`}>
                                {publication?.title}
                              </a>
                              <div className="publication-meta">
                                {publication.publicationDate?.[0] && (
                                  <span>{publication.publicationDate[0]}</span>
                                )}
                                {publication.type?.[0] && (
                                  <span className="type">
                                    {" "}
                                    - {publication.type[0]}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        />
                      </li>
                      */}
                    </ul>
                  </div>
                </div>
                <PersonProduction publications={result.authorOf?.raw} />
              </div>
              <ChordDiagram authorId="7ea9469a-1088-4913-aa01-d161d440f564" />
              <AdvisorGraph advisorId="16aebc49-33c0-48c2-8de5-3189cbdf7280" />
            </div>
          ))}
      </ErrorBoundary>
    </>
  );
}
