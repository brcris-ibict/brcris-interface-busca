import { ErrorBoundary, useSearch } from "@elastic/react-search-ui";
import Head from "next/head";
import { useTranslation } from "next-i18next";
import { CSVLink } from "react-csv";
import { getBioByLanguage, getLattesIdentifier } from "../../../utils/Utils";
import { useJournals } from "../../hooks/useJournals";
import CopyLink from "../CopyLink";
import ShowItem from "../customResultView/ShowItem";
import ExpandableContent from "../ExpandableContent";
import Loader from "../Loader";
import AdvisorGraph from "./AdvisorGraph";
import ChordDiagram from "./ChordDiagram";
import PatentsByInventor from "./PatentsByInventor";
import PersonProduction from "./PersonProduction";
import SoftwareTitle from "./SoftwareTitle";

const publicationCsvHeaders = [
  { label: "Título", key: "title" },
  { label: "Revista", key: "journal" },
  { label: "Ano", key: "year" },
  { label: "Tipo", key: "type" },
  { label: "ID", key: "id" },
];
export default function PeopleDetails() {
  const { wasSearched, isLoading, results } = useSearch();
  const journalsMap = useJournals(results);
  const { t } = useTranslation("common");
  const { i18n } = useTranslation();
  const lang = i18n.language.startsWith("pt") ? "pt" : "en";

  const formattedPublicationsForCsv =
    results?.[0]?.authorOf?.raw?.map((publication: any) => ({
      title: publication?.title ?? "",
      journal: journalsMap[publication?.id] ?? "",
      year: publication?.publicationDate?.[0] ?? "",
      type: publication?.type?.[0] ?? "",
      id: publication?.id ?? "",
    })) ?? [];

  const publicationTypeMap: Record<string, string> = {
    Artigo: t("Journal article"),
    "Artigo de Conferência": t("Conference paper"),
    "Capítulo de Livro": t("Book chapter"),
    Livro: t("Book"),
    Dissertação: t("Dissertation"),
    Tese: t("Thesis"),
    "Conjunto de Dados": t("Dataset"),
    Preprint: t("Preprint"),
  };
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
                    <title>
                      {result.name?.raw
                        ? `${result.name.raw} | BrCris`
                        : "BrCris"}
                    </title>
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
                        text={getBioByLanguage(result.bio?.raw, lang)}
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

                      {result.authorOf?.raw?.length > 0 && (
                        <li>
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <strong className="research-title">
                              {t("Publications")}: (
                              {result.authorOf?.raw?.length ?? 0})
                            </strong>

                            {/* @ts-ignore */}
                            <CSVLink
                              data={formattedPublicationsForCsv}
                              headers={publicationCsvHeaders}
                              filename={`publicacoes-${result.name?.raw ?? "autor"}.csv`}
                              className="btn btn-primary btn-sm"
                            >
                              ⬇ {t("Export csv")}
                            </CSVLink>
                          </div>

                          {(() => {
                            const publications = result.authorOf?.raw || [];

                            const publicationsByType = publications.reduce(
                              (acc: any, pub: any) => {
                                const type = pub?.type?.[0] || "Outros";

                                if (!acc[type]) acc[type] = [];

                                acc[type].push(pub);

                                return acc;
                              },
                              {},
                            );

                            return Object.entries(publicationsByType).map(
                              ([type, pubs]: any) => {
                                const sortedPubs = pubs
                                  .slice()
                                  .sort((a: any, b: any) => {
                                    const dateA = new Date(
                                      a.publicationDate?.[0] || 0,
                                    ).getTime();
                                    const dateB = new Date(
                                      b.publicationDate?.[0] || 0,
                                    ).getTime();
                                    return dateB - dateA;
                                  });

                                return (
                                  <div
                                    key={type}
                                    className="publication-section"
                                  >
                                    <div className="publication-header">
                                      <div className="publication-title">
                                        <span className="publication-dot"></span>
                                        {publicationTypeMap[type] || type}
                                      </div>

                                      <div className="publication-count">
                                        {sortedPubs.length}
                                      </div>
                                    </div>

                                    <div className="publication-group">
                                      <ExpandableContent
                                        items={sortedPubs}
                                        initialCount={5}
                                        renderItem={(publication: any) => (
                                          <div className="publication-item">
                                            <a
                                              href={`/publications/${publication?.id}`}
                                            >
                                              {publication?.title}
                                            </a>

                                            <div className="publication-meta">
                                              {[
                                                journalsMap[publication?.id],
                                                publication
                                                  .publicationDate?.[0],
                                                publication.type?.[0],
                                              ]
                                                .filter(Boolean)
                                                .join(" - ")}
                                            </div>
                                          </div>
                                        )}
                                      />
                                    </div>
                                  </div>
                                );
                              },
                            );
                          })()}
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
                    </ul>
                  </div>
                </div>
                <PersonProduction
                  publications={result.authorOf?.raw}
                  authorId={result.id?.raw}
                />
              </div>
              <ChordDiagram authorId={result.id?.raw} />
              <AdvisorGraph advisorId={result.id?.raw} />
            </div>
          ))}
      </ErrorBoundary>
    </>
  );
}
