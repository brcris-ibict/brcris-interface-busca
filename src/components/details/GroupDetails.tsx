import { ErrorBoundary, useSearch } from "@elastic/react-search-ui";
import Head from "next/head";
import { useTranslation } from "next-i18next";
import type { OrgUnit } from "../../types/Entities";
import CopyLink from "../CopyLink";
import ShowAuthorItem from "../customResultView/ShowAuthorItem";
import ShowItem from "../customResultView/ShowItem";
import ExpandableContent from "../ExpandableContent";
import Loader from "../Loader";

export default function GroupDetails() {
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
                <title>{`${result.name?.raw} | BrCris`}</title>
              </Head>
              <div className="mb-3 position-relative">
                <div className="d-flex justify-content-between align-items-center">
                  <h1 className="title mb-0">{result.name?.raw}</h1>
                </div>

                <div className="mt-2">
                  {result.id?.raw && (
                    <div className="d-flex align-items-center gap-2">
                      <img
                        className="brcris-logo"
                        src="/logos/logo-brcris.png"
                        alt="logo do BrCris"
                      />
                      <CopyLink
                        link={`${location.origin}/research-groups/${result.id.raw}`}
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="details-card">
                <ul>
                  <ShowItem
                    label={t("Creation year")}
                    value={result.creationYear?.raw}
                  />
                  <ShowItem
                    label={t("Research line")}
                    value={result.researchLine?.raw}
                  />
                  <ShowAuthorItem
                    label={t("Leader")}
                    authors={result.leader?.raw}
                  />
                  {result.orgUnit?.raw?.length > 0 && (
                    <li>
                      <span className="sui-result__key">
                        {t("Organization")}
                      </span>
                      <span className="sui-result__value">
                        {result.orgUnit?.raw.map((org: OrgUnit) => (
                          <a key={org.id} href={`/organizations/${org.id}`}>
                            {org.name!}
                          </a>
                        ))}
                      </span>
                    </li>
                  )}

                  {result.partner?.raw?.length > 0 && (
                    <li>
                      <span className="sui-result__key">{t("Partner")}</span>
                      {result.partner?.raw.map((partner: any) => (
                        <span key={partner.id} className="sui-result__value">
                          <a
                            key={partner.id}
                            href={`/organizations/${partner.id}`}
                          >
                            {partner.name}
                          </a>
                        </span>
                      ))}
                    </li>
                  )}

                  <ShowItem
                    label={t("URL")}
                    value={result.url?.raw}
                    urlLink={result.url?.raw}
                  />
                  <ShowItem label={t("Status")} value={result.status?.raw} />
                  <ShowItem
                    label={t("Application sector")}
                    value={result.applicationSector?.raw}
                  />
                  {result.member?.raw?.length > 0 && (
                    <li>
                      <span className="sui-result__key">{t("Has member")}</span>
                      <ExpandableContent
                        items={result.member?.raw}
                        initialCount={5}
                        renderItem={(item: any, idx: number) => (
                          <div key={idx} className="member-item">
                            <a href={`/people/${item.id}`}>{item?.name}</a>
                          </div>
                        )}
                      />
                    </li>
                  )}
                  {result.leaderResearcher?.raw?.length > 0 && (
                    <li>
                      <span className="sui-result__key">{t("Has leader")}</span>
                      <span className="sui-result__value">
                        {result.leaderResearcher.raw.map((leader: any) => (
                          <a key={leader.id} href={`/people/${leader.id}`}>
                            {Array.isArray(leader.name)
                              ? leader.name[0]
                              : leader.name}
                          </a>
                        ))}
                      </span>
                    </li>
                  )}
                  <ShowItem
                    label={t("Knowledge area")}
                    value={result.knowledgeArea?.raw}
                  />
                  <ShowItem
                    label={t("Keywords")}
                    value={result.keywords?.raw}
                  />
                  <ShowItem
                    label={t("Software")}
                    value={result.software?.raw}
                  />
                  <ShowItem
                    label={t("Equipment")}
                    value={result.equipment?.raw}
                  />
                  <ShowItem
                    label={t("Description")}
                    value={result.description?.raw}
                  />
                </ul>
              </div>
            </div>
          ))}
      </ErrorBoundary>
    </div>
  );
}
