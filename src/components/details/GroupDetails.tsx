import { useSearch } from "@elastic/react-search-ui";
import Head from "next/head";
import { useTranslation } from "next-i18next";
import { normalizeText } from "../../../utils/Utils";
import { withBasePath } from "../../lib/basePath";
import NotFound from "../../pages/404";
import type { OrgUnit } from "../../types/Entities";
import CopyLink from "../CopyLink";
import ShowItem from "../customResultView/ShowItem";
import DataUpdateModal from "../DataUpdateModal";
import ExpandableContent from "../ExpandableContent";
import Loader from "../Loader";
import ReportPopoverButton from "../ReportPopoverButton";

export default function GroupDetails() {
  const { isLoading, results, wasSearched } = useSearch();
  const { t } = useTranslation("common");

  const result = results?.[0];

  if (isLoading || !wasSearched) {
    return <Loader />;
  }

  if (wasSearched && results.length === 0) {
    return <NotFound />;
  }

  const groupId = result.id?.raw;

  return (
    <div>
      <Head>
        <title>{`${normalizeText(result.name?.raw)} | BrCris`}</title>
      </Head>

      <div className="mb-3 position-relative">
        <div className="d-flex justify-content-between align-items-center">
          <h1 className="title mb-0">{normalizeText(result.name?.raw)}</h1>
        </div>

        <div className="mt-2">
          <div className="d-flex justify-content-between w-100 flex-column flex-md-row gap-2 align-items-md-center">
            {groupId && (
              <div className="d-flex align-items-center gap-2">
                <img
                  className="brcris-logo"
                  src={withBasePath("/logos/brcris-grafo.svg")}
                  alt="logo do BrCris"
                />

                <CopyLink
                  link={`${location.origin}${withBasePath(`/research-groups/${groupId}`)}`}
                />
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
          <ShowItem
            label={t("Creation year")}
            value={result.creationYear?.raw}
          />

          <ShowItem
            label={t("Research line")}
            value={result.researchLine?.raw}
          />

          {result.leaderResearcher?.raw?.length > 0 && (
            <li>
              <span className="sui-result__key">{t("Leader")}</span>

              <ExpandableContent
                items={result.leaderResearcher.raw}
                initialCount={5}
                renderItem={(leader: any) => (
                  <a
                    key={leader.id}
                    href={withBasePath(`/people/${leader.id}`)}
                  >
                    {normalizeText(
                      Array.isArray(leader.name) ? leader.name[0] : leader.name,
                    )}
                  </a>
                )}
              />
            </li>
          )}

          {result.leaderOrgUnit?.raw?.length > 0 && (
            <li>
              <span className="sui-result__key">{t("Organization")}</span>

              <ExpandableContent
                items={result.leaderOrgUnit.raw}
                initialCount={5}
                renderItem={(org: OrgUnit) => (
                  <a
                    key={org.id}
                    href={withBasePath(`/organizations/${org.id}`)}
                  >
                    {normalizeText(org.name)}
                  </a>
                )}
              />
            </li>
          )}

          {result.partner?.raw?.length > 0 && (
            <li>
              <span className="sui-result__key">{t("Partner")}</span>

              <ExpandableContent
                items={result.partner.raw}
                initialCount={5}
                renderItem={(partner: any) => (
                  <a
                    key={partner.id}
                    href={withBasePath(`/organizations/${partner.id}`)}
                  >
                    {normalizeText(partner.name)}
                  </a>
                )}
              />
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
              <span className="sui-result__key">{t("Member")}</span>

              <ExpandableContent
                items={result.member.raw}
                initialCount={5}
                renderItem={(item: any, idx: number) => (
                  <div key={idx} className="member-item">
                    <a href={withBasePath(`/people/${item.id}`)}>
                      {normalizeText(item?.name)}
                    </a>
                  </div>
                )}
              />
            </li>
          )}

          <ShowItem
            label={t("Knowledge area")}
            value={result.knowledgeArea?.raw}
          />

          <ShowItem label={t("Keywords")} value={result.keywords?.raw} />

          <ShowItem label={t("Software")} value={result.software?.raw} />

          <ShowItem label={t("Equipment")} value={result.equipment?.raw} />

          <ShowItem label={t("Description")} value={result.description?.raw} />
        </ul>
      </div>
    </div>
  );
}
